import express from "express";
import verifyFirebaseToken from '../Middleware/authMiddleware.js';
import db from "../MySQL/db.js";

/**
 * Conversation Routes Factory Function
 * Creates and configures Express router for conversation/messaging endpoints
 * 
 * @param {Object} io - Socket.IO server instance for real-time messaging
 * @param {Object} firestore - Firestore database instance for message storage
 * @returns {express.Router} - Configured Express router with conversation routes
 * 
 * Architecture Note:
 * - This uses a factory pattern to inject dependencies (io, firestore)
 * - Allows routes to access Socket.IO and Firestore without global variables
 * - Enables better testing and modularity
 */
export default function conversationRoutes(io, firestore) {
  // Create Express router instance for conversation-related routes
  const router = express.Router();

  // ========================================
  // GET MESSAGES FOR A CONVERSATION
  // ========================================

  /**
   * GET /conversations/:conversationId
   * Retrieves all messages for a specific conversation
   * Messages are fetched from Firestore and returned in chronological order
   * 
   * Authentication: Required (verifyFirebaseToken middleware)
   * 
   * URL Parameters:
   * - conversationId: Unique identifier for the conversation (DM or group)
   * 
   * Response: 
   * {
   *   messages: [
   *     {
   *       id: string,          // Firestore document ID
   *       text: string,        // Message content
   *       senderId: string,    // MySQL user ID of sender
   *       createdAt: Timestamp // Firestore timestamp
   *     }
   *   ]
   * }
   */
  router.get("/:conversationId", verifyFirebaseToken, async (req, res) => {
    try {
      // Extract conversation ID from URL parameters
      const { conversationId } = req.params;
      
      // ========================================
      // Query Firestore for messages
      // ========================================
      
      // Navigate to the messages subcollection within the conversation document
      const snapshot = await firestore
        .collection("conversations")           // Access conversations collection
        .doc(conversationId)                   // Access specific conversation document
        .collection("messages")                // Access messages subcollection
        .orderBy("createdAt", "asc")          // Sort by creation time (oldest first)
        .get();                                // Execute query and get snapshot
      
      // ========================================
      // Transform Firestore documents to JSON
      // ========================================
      
      // Map Firestore documents to plain JavaScript objects
      // Spread operator combines document ID with document data
      const messages = snapshot.docs.map((doc) => ({ 
        id: doc.id,      // Firestore document ID
        ...doc.data()    // All document fields (text, senderId, createdAt)
      }));
      
      // Send messages array as JSON response
      res.json({ messages });
      
    } catch (err) {
      // Handle errors (e.g., Firestore connection issues, invalid conversationId)
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // ========================================
  // LIST ALL USER'S CONVERSATIONS
  // ========================================

  /**
   * GET /conversations/list/:userId
   * Retrieves all conversations (DMs and groups) that a user is a member of
   * Enriches DM conversations with other participant's profile information
   * 
   * Authentication: Required (verifyFirebaseToken middleware)
   * 
   * URL Parameters:
   * - userId: MySQL user ID of the requesting user
   * 
   * Response:
   * {
   *   conversations: [
   *     {
   *       id: string,              // Conversation ID
   *       isGroup: boolean,        // true for groups, false for DMs
   *       name: string,            // Group name or DM partner's name
   *       members: string[],       // Array of member user IDs
   *       lastMessage: string,     // Preview of most recent message
   *       lastUpdatedAt: Timestamp,// When conversation was last active
   *       dmWith: {                // Only present for DMs
   *         id: string,            // Other user's ID
   *         name: string,          // Other user's name
   *         pfp: string            // Other user's profile picture URL
   *       }
   *     }
   *   ]
   * }
   * 
   * Use Case:
   * - Powers the conversation sidebar/list in the messaging interface
   * - Shows both individual DMs and group chats
   * - Displays last message preview for each conversation
   */
  router.get("/list/:userId", verifyFirebaseToken, async (req, res) => {
    try {
      // Extract user ID from URL parameters
      const { userId } = req.params;
      
      // ========================================
      // Query Firestore for user's conversations
      // ========================================
      
      // Find all conversations where user is a member
      // array-contains checks if userId exists in the members array field
      const convSnap = await firestore.collection("conversations")
        .where("members", "array-contains", String(userId))  // Convert to string for consistency
        .get();
      
      // Array to store processed conversation objects
      const convs = [];
      
      // ========================================
      // Process each conversation
      // ========================================
      
      // Iterate through each conversation document
      for (const doc of convSnap.docs) {
        // Get conversation data from Firestore document
        const c = doc.data();
        
        // Build base conversation object with common fields
        const base = {
          id: doc.id,                           // Firestore document ID
          isGroup: !!c.isGroup,                 // Convert to boolean (true for groups)
          name: c.name || null,                 // Group name (null for DMs)
          members: c.members || [],             // Array of member user IDs
          lastMessage: c.lastMessage || null,   // Preview of last message
          lastUpdatedAt: c.lastUpdatedAt || null, // Timestamp of last activity
        };
        
        // ========================================
        // Enrich DM conversations with partner info
        // ========================================
        
        // If this is a direct message (not a group)
        if (!base.isGroup) {
          // Find the OTHER user in the conversation
          // Filter out the requesting user to get their chat partner's ID
          const otherId = base.members.find(m => String(m) !== String(userId));
          
          // If other user ID was found
          if (otherId) {
            // ========================================
            // Fetch partner's profile from MySQL
            // ========================================
            
            // Query MySQL to get partner's name and profile picture
            const [rows] = await db.query(
              "SELECT name, pfp FROM users WHERE id = ?", 
              [otherId]
            );
            
            // Add partner information to conversation object
            base.dmWith = { 
              id: otherId,                                    // Partner's user ID
              name: rows?.[0]?.name || `User ${otherId}`,   // Partner's name or fallback
              pfp: rows?.[0]?.pfp || null                    // Partner's profile picture URL
            };
            
            // Set conversation name to partner's name for display
            base.name = base.dmWith.name;
          }
        }
        
        // Add processed conversation to results array
        convs.push(base);
      }
      
      // ========================================
      // Return conversation list
      // ========================================
      
      // Send array of conversation objects as JSON response
      res.json({ conversations: convs });
      
    } catch (err) {
      // Handle errors (e.g., Firestore/MySQL connection issues, invalid userId)
      res.status(500).json({ error: "Failed to list conversations" });
    }
  });

  // Return configured router to be mounted in main server file
  return router;
}
