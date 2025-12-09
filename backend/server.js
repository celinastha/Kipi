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

// SERVER INITIALIZATION

// Load environment variables from .env file
dotenv.config();

// Create Express application instance
const app = express();

// Enable JSON body parsing for incoming requests
app.use(express.json());

// Enable Cross-Origin Resource Sharing (CORS) to allow frontend access
app.use(cors());

// Initialize Firestore database connection for real-time messaging storage
// Firestore is used as a NoSQL document database for conversations and messages
const firestore = new Firestore({
  projectId: process.env.FIREBASE_PROJECT_ID,
  keyFilename: "./Firebase/FirebaseServiceAccountKey.json",
  preferRest: true, // Use REST API instead of gRPC for better compatibility
});

// Create HTTP server wrapping the Express app
// This allows both HTTP and WebSocket connections on the same port
const server = http.createServer(app);

// Initialize Socket.IO server for real-time bidirectional communication
// Attached to the HTTP server to enable WebSocket connections
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for development (should be restricted in production)
    methods: ["GET", "POST"], // Allow these HTTP methods for CORS preflight
  },
});

// REST API ROUTE REGISTRATION

// Mount authentication routes (signup, login) at /auth endpoint
app.use("/auth", authRoutes);

// Mount protected routes (requires authentication) at /protected endpoint
app.use("/protected", protectedRoutes); 

// Mount user management routes (profile, search) at /users endpoint
app.use('/users', userRoutes);

// Mount friend system routes (request, accept, reject, unfriend) at /friends endpoint
app.use('/friends', friendRoutes);

// Mount calendar event routes (create, view events) at /calender endpoint
app.use('/calender', calenderRoutes);

// Mount conversation routes (get conversations, messages) at /conversations endpoint
// Pass io and firestore instances to enable real-time message broadcasting
app.use("/conversations", conversationRoutes(io, firestore));

// UTILITY FUNCTIONS

/**
 * Sanitizes values retrieved from MySQL database
 * Converts Buffer objects to UTF-8 strings to prevent type issues
 * @param {any} val - Value to sanitize (typically from MySQL query result)
 * @returns {string|any} - Sanitized value
 */
function sanitize(val) {
  if (Buffer.isBuffer(val)) return val.toString("utf8");
  return val;
}

// MESSAGE PERSISTENCE

/**
 * Persists a chat message to Firestore database
 * Updates both the messages subcollection and conversation metadata
 * @param {Object} params - Message parameters
 * @param {string} params.conversationId - Unique conversation identifier
 * @param {string} params.text - Message content
 * @param {string} params.senderId - User ID of message sender
 */
async function persistMessage({ conversationId, text, senderId }) {
  // Reference to the specific conversation document in Firestore
  const convRef = firestore.collection("conversations").doc(conversationId);
  
  // Add message to the messages subcollection with timestamp
  await convRef.collection("messages").add({
    text,
    senderId: String(sanitize(senderId)), // Ensure senderId is string type
    createdAt: Firestore.Timestamp.now(), // Server-side timestamp
  });
  
  // Update conversation metadata with last message and timestamp
  // merge: true prevents overwriting other conversation fields
  await convRef.set(
    { 
      lastMessage: text, 
      lastUpdatedAt: Firestore.Timestamp.now() 
    },
    { merge: true }
  );
}

// SOCKET.IO AUTHENTICATION MIDDLEWARE

/**
 * Socket.IO middleware to authenticate WebSocket connections
 * Verifies Firebase JWT token and retrieves user ID from MySQL
 * Executed before establishing socket connection
 */
io.use(async (socket, next) => {
  try {
    // Extract JWT token from socket handshake authentication data
    const token = socket.handshake.auth?.token;
    
    // Reject connection if no token provided
    if (!token) return next(new Error("No token provided"));
    
    // Verify Firebase ID token and decode user information
    const decoded = await admin.auth().verifyIdToken(token);
    
    // Query MySQL to get internal user ID from Firebase UID
    const [rows] = await db.query(
      "SELECT id FROM users WHERE firebase_uid = ?", 
      [decoded.uid]
    );
    
    // Reject connection if user not found in database
    if (!rows.length) return next(new Error("User not found"));
    
    // Attach user ID to socket object for use in event handlers
    socket.userId = sanitize(rows[0].id);
    
    // Allow connection to proceed
    next();
  } catch (err) {
    console.error("Auth failed:", err);
    next(new Error("Unauthorized"));
  }
});

// SOCKET.IO EVENT HANDLERS

/**
 * Handle new WebSocket connections
 * Triggered when a client successfully connects via Socket.IO
 */
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.userId);

  /**
   * Event: joinRoom
   * Adds user to a conversation room for targeted message broadcasting
   * Rooms enable sending messages only to participants in a conversation
   */
  socket.on("joinRoom", ({ conversationId }) => {
    socket.join(conversationId); // Join Socket.IO room identified by conversationId
    console.log(`User ${socket.userId} joined room ${conversationId}`);
  });

  /**
   * Event: sendMessage
   * Handles incoming chat messages from clients
   * Persists message to Firestore and broadcasts to all room participants
   */
  socket.on("sendMessage", async ({ conversationId, text }) => {
    // Validate required parameters
    if (!conversationId || !text) return;
    
    // Save message to Firestore database
    await persistMessage({ conversationId, text, senderId: socket.userId });
    
    // Broadcast message to all clients in the conversation room
    // Includes conversationId so clients can identify which conversation it belongs to
    io.to(conversationId).emit("message", { 
      conversationId, 
      text, 
      senderId: socket.userId 
    });
  });

  /**
   * Event: startDM
   * Creates or retrieves a direct message (DM) conversation between two users
   * Uses deterministic ID generation to ensure same DM is used for both users
   */
  socket.on("startDM", async ({ otherId }) => {
    // Validate other user ID
    if (!otherId) return socket.emit("error", { message: "Invalid otherId" });
    
    // Sanitize user IDs and convert to strings
    const a = String(sanitize(socket.userId));
    const b = String(sanitize(otherId));
    
    // Create deterministic conversation ID by sorting user IDs
    // Format: "dm_userId1_userId2" (lower ID always first)
    // This ensures both users reference the same conversation document
    const conversationId = ["dm", ...[a, b].sort()].join("_");
    
    // Reference to conversation document in Firestore
    const convRef = firestore.collection("conversations").doc(conversationId);
    
    // Create conversation if it doesn't exist
    if (!(await convRef.get()).exists) {
      await convRef.set({
        isGroup: false, // Mark as direct message (not group chat)
        members: [a, b], // Array of participant user IDs
        createdAt: Firestore.Timestamp.now(),
      });
    }
    
    // Send conversation ID back to client so they can join and send messages
    socket.emit("dmReady", { conversationId });
  });

  /**
   * Event: createGroup
   * Creates a new group conversation with multiple participants
   * Automatically includes the creator as a member
   */
  socket.on("createGroup", async ({ name, memberIds }) => {
    // Validate that member list is provided
    if (!memberIds || memberIds.length === 0) {
      return socket.emit("error", { message: "No members provided" });
    }
    
    // Sanitize creator ID
    const creator = String(sanitize(socket.userId));
    
    // Combine creator with other members, sanitize all IDs
    const members = [creator, ...memberIds.map(m => String(sanitize(m)))];
    
    // Create new conversation document with auto-generated ID
    const convRef = firestore.collection("conversations").doc();
    
    await convRef.set({
      isGroup: true, // Mark as group conversation
      name: name || "New Group", // Use provided name or default
      members, // Array of all participant user IDs
      createdAt: Firestore.Timestamp.now(),
    });
    
    // Send generated conversation ID back to client
    socket.emit("groupReady", { conversationId: convRef.id });
  });
});

// START SERVER

// Define server port (from environment variable or default to 3000)
const PORT = process.env.PORT || 3000;

// Start HTTP + WebSocket server on specified port
// This single server handles both REST API requests and Socket.IO connections
server.listen(PORT, () => {
  console.log(`✅ Server + Socket.io listening on port ${PORT}`);
});
