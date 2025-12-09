import express from "express";
import verifyFirebaseToken from '../Middleware/authMiddleware.js';
import db from "../MySQL/db.js";

export default function conversationRoutes(io, firestore) {
  const router = express.Router();

  // ✅ UPDATED: Get messages for a conversation
  router.get("/:conversationId", verifyFirebaseToken, async (req, res) => {
    try {
      const { conversationId } = req.params;
      const snapshot = await firestore
        .collection("conversations")
        .doc(conversationId)
        .collection("messages")
        .orderBy("createdAt", "asc")
        .get();
      const messages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.json({ messages });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // ✅ NEW: List conversations (DMs + Groups) for sidebar
  router.get("/list/:userId", verifyFirebaseToken, async (req, res) => {
    try {
      const { userId } = req.params;
      const convSnap = await firestore.collection("conversations")
        .where("members", "array-contains", String(userId))
        .get();

      const convs = [];
      for (const doc of convSnap.docs) {
        const c = doc.data();
        const base = {
          id: doc.id,
          isGroup: !!c.isGroup,
          name: c.name || null,
          members: c.members || [],
          lastMessage: c.lastMessage || null,
          lastUpdatedAt: c.lastUpdatedAt || null,
        };
        if (!base.isGroup) {
          const otherId = base.members.find(m => String(m) !== String(userId));
          if (otherId) {
            const [rows] = await db.query("SELECT name, pfp FROM users WHERE id = ?", [otherId]);
            base.dmWith = { id: otherId, name: rows?.[0]?.name || `User ${otherId}`, pfp: rows?.[0]?.pfp || null };
            base.name = base.dmWith.name;
          }
        }
        convs.push(base);
      }
      res.json({ conversations: convs });
    } catch (err) {
      res.status(500).json({ error: "Failed to list conversations" });
    }
  });

  return router;
}