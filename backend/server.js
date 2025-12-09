import express from 'express'
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import authRoutes from './Routes/authRoutes.js'
import protectedRoutes from './Routes/protected.js'
import userRoutes from './Routes/userRoutes.js'
import friendRoutes from './Routes/friendRoutes.js'
import calenderRoutes from './Routes/calenderRoutes.js'
import conversationRoutes from './Routes/conversationRoutes.js'
import verifyFirebaseToken from './Middleware/authMiddleware.js'
import db from './MySQL/db.js'
import admin from './Firebase/firebaseAdmin.js'
import { Server } from "socket.io";
import { Firestore } from "@google-cloud/firestore";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const firestore = new Firestore({
  projectId: process.env.FIREBASE_PROJECT_ID,
  keyFilename: "./Firebase/FirebaseServiceAccountKey.json",
  preferRest: true,
});


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // allow all origins for dev
    methods: ["GET", "POST"],
  },
});



app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes); 
app.use('/users', userRoutes);
app.use('/friends', friendRoutes);
app.use('/calender', calenderRoutes);
app.use("/conversations", conversationRoutes(io, firestore));


function sanitize(val) {
  if (Buffer.isBuffer(val)) return val.toString("utf8");
  return val;
}

// ✅ UPDATED: persist messages in Firestore
async function persistMessage({ conversationId, text, senderId }) {
  const convRef = firestore.collection("conversations").doc(conversationId);
  await convRef.collection("messages").add({
    text,
    senderId: String(sanitize(senderId)),
    createdAt: Firestore.Timestamp.now(),
  });
  await convRef.set(
    { lastMessage: text, lastUpdatedAt: Firestore.Timestamp.now() },
    { merge: true }
  );
}

// Socket.io auth
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token provided"));
    const decoded = await admin.auth().verifyIdToken(token);
    const [rows] = await db.query("SELECT id FROM users WHERE firebase_uid = ?", [decoded.uid]);
    if (!rows.length) return next(new Error("User not found"));
    socket.userId = sanitize(rows[0].id);
    next();
  } catch (err) {
    console.error("Auth failed:", err);
    next(new Error("Unauthorized"));
  }
});

// Socket.io events
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.userId);

  socket.on("joinRoom", ({ conversationId }) => {
    socket.join(conversationId);
    console.log(`User ${socket.userId} joined room ${conversationId}`);
  });

  socket.on("sendMessage", async ({ conversationId, text }) => {
    if (!conversationId || !text) return;
    await persistMessage({ conversationId, text, senderId: socket.userId });
    io.to(conversationId).emit("message", { conversationId, text, senderId: socket.userId }); // ✅ UPDATED: include conversationId
  });

  socket.on("startDM", async ({ otherId }) => {
    if (!otherId) return socket.emit("error", { message: "Invalid otherId" });
    const a = String(sanitize(socket.userId));
    const b = String(sanitize(otherId));
    const conversationId = ["dm", ...[a, b].sort()].join("_"); // ✅ UPDATED: deterministic DM id
    const convRef = firestore.collection("conversations").doc(conversationId);
    if (!(await convRef.get()).exists) {
      await convRef.set({
        isGroup: false,
        members: [a, b],
        createdAt: Firestore.Timestamp.now(),
      });
    }
    socket.emit("dmReady", { conversationId });
  });

  socket.on("createGroup", async ({ name, memberIds }) => {
    if (!memberIds || memberIds.length === 0) {
      return socket.emit("error", { message: "No members provided" });
    }
    const creator = String(sanitize(socket.userId));
    const members = [creator, ...memberIds.map(m => String(sanitize(m)))];
    const convRef = firestore.collection("conversations").doc();
    await convRef.set({
      isGroup: true,
      name: name || "New Group",
      members,
      createdAt: Firestore.Timestamp.now(),
    });
    socket.emit("groupReady", { conversationId: convRef.id });
  });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server  + Socket.io listening on port ${PORT}`);
});
