//  framework + utilities
import express from 'express'
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
// Route modules
import authRoutes from './Routes/authRoutes.js'
import protectedRoutes from './Routes/protected.js'
import userRoutes from './Routes/userRoutes.js'
import friendRoutes from './Routes/friendRoutes.js'
import calenderRoutes from './Routes/calenderRoutes.js'
import conversationRoutes from './Routes/conversationRoutes.js'
// Auth + data layer
import verifyFirebaseToken from './Middleware/authMiddleware.js' // (currently not used directly in this file)
import db from './MySQL/db.js'
import admin from './Firebase/firebaseAdmin.js'
// Realtime + database
import { Server } from "socket.io";
import { Firestore } from "@google-cloud/firestore";
// Load variables, without exposing secrets
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
// Initialize Firestore client for storing conversations and messages
const firestore = new Firestore({
  projectId: process.env.FIREBASE_PROJECT_ID,
  keyFilename: "./Firebase/FirebaseServiceAccountKey.json",
  preferRest: true,
});
const server = http.createServer(app);
// Attach Socket.io for real-time features
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.use("/auth", authRoutes);                      // signup / login 
app.use("/protected", protectedRoutes);            // routes that require auth
app.use('/users', userRoutes);                     // User profile and account info
app.use('/friends', friendRoutes);                 // Friend list / friend requests
app.use('/calender', calenderRoutes);              // Calendar events and scheduling
// Conversations routes receive io + firestore so they can trigger real-time events
app.use("/conversations", conversationRoutes(io, firestore));

function sanitize(val) {
  if (Buffer.isBuffer(val)) return val.toString("utf8");
  return val;
}

// Responsible for writing a new message to Firestore and updating conversation metadata.
//Each conversation is stored as a document in "conversations/{conversationId}".
//Individual messages live in a subcollection "conversations/{conversationId}/messages".
async function persistMessage({ conversationId, text, senderId }) {
  const convRef = firestore.collection("conversations").doc(conversationId);

  // Store the message with server-side timestamp for consistent ordering
  await convRef.collection("messages").add({
    text,
    senderId: String(sanitize(senderId)),
    createdAt: Firestore.Timestamp.now(),
  });

  // Update summary fields on the conversation document for fast listing/ordering
  await convRef.set(
    { lastMessage: text, lastUpdatedAt: Firestore.Timestamp.now() },
    { merge: true } 
  );
}

//We want every socket to be associated with a verified user.
io.use(async (socket, next) => {
  try {
    // Token is provided by the frontend when creating the socket connection
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token provided"));
    // Verify the Firebase token (ensures it's valid and not expired)
    const decoded = await admin.auth().verifyIdToken(token);
    // Map Firebase UID to our internal numeric user ID in MySQL
    const [rows] = await db.query(
      "SELECT id FROM users WHERE firebase_uid = ?",
      [decoded.uid]
    );

    if (!rows.length) return next(new Error("User not found"));

    // Store the internal user ID on the socket so later events know who this client is
    socket.userId = sanitize(rows[0].id);
    next();
  } catch (err) {
    console.error("Auth failed:", err);
    next(new Error("Unauthorized"));
  }
});

//All real-time chat behavior (joining rooms, sending messages, creating conversations)
//is implemented here. Each connected client has its own socket instance.
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.userId);

  //Allows a user to join a specific conversation room.
  socket.on("joinRoom", ({ conversationId }) => {
    socket.join(conversationId);
    console.log(`User ${socket.userId} joined room ${conversationId}`);
  });
  //sending a message: 
  //1. Validate that we have a conversationId and message text.
  //2. Persist the message to Firestore (for history and reloads).
  //3. Broadcast the message to everyone currently in that conversation room.
  socket.on("sendMessage", async ({ conversationId, text }) => {
    if (!conversationId || !text) return;
    await persistMessage({ conversationId, text, senderId: socket.userId });
    io.to(conversationId).emit("message", {
      conversationId,
      text,
      senderId: socket.userId,
    });
  });
   //startDM: Creates or reuses a 1-to-1 “direct message” conversation between the current user
   //and another user.
  socket.on("startDM", async ({ otherId }) => {
    if (!otherId) return socket.emit("error", { message: "Invalid otherId" });

    const a = String(sanitize(socket.userId));
    const b = String(sanitize(otherId));

    // Sort user IDs so "dm_1_2" and "dm_2_1" map to the same conversation
    const conversationId = ["dm", ...[a, b].sort()].join("_");

    const convRef = firestore.collection("conversations").doc(conversationId);

    // Only create the DM metadata once; later calls simply reuse it.
    if (!(await convRef.get()).exists) {
      await convRef.set({
        isGroup: false,
        members: [a, b],
        createdAt: Firestore.Timestamp.now(),
      });
    }

    // Notify the client which conversation ID to use from now on
    socket.emit("dmReady", { conversationId });
  });

 //Creates a brand-new group conversation with multiple members.
 //For groups we don't need deterministic IDs; Firestore's auto IDs are simpler
 //and avoid collisions.
  socket.on("createGroup", async ({ name, memberIds }) => {
    if (!memberIds || memberIds.length === 0) {
      return socket.emit("error", { message: "No members provided" });
    }
    const creator = String(sanitize(socket.userId));
    // Ensure creator is always part of the group, and normalize member IDs to strings
    const members = [creator, ...memberIds.map(m => String(sanitize(m)))];
    const convRef = firestore.collection("conversations").doc();
    await convRef.set({
      isGroup: true,
      name: name || "New Group",
      members,
      createdAt: Firestore.Timestamp.now(),
    });

    // Let the creator know the new conversation ID so they can join it in the UI
    socket.emit("groupReady", { conversationId: convRef.id });
  });
});

const PORT = process.env.PORT || 3000;
// Start both the Express API and Socket.io server on the same port
server.listen(PORT, () => {
  console.log(`✅ Server  + Socket.io listening on port ${PORT}`);
});
