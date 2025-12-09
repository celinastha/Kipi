import { Router } from 'express';
import express from 'express';
import admin from '../Firebase/firebaseAdmin.js';
import db from "../MySQL/db.js";
import { deBuffer } from '../utils/debuffer.js';

// Create Express router instance for friend-related routes
const router = Router();

// ========================================
// GET ALL FRIENDS (ACCEPTED + PENDING)
// ========================================

/**
 * GET /friends/:userId
 * Retrieves all friend relationships for a user (both accepted and pending)
 * Returns user profiles with friendship metadata
 * 
 * URL Parameters:
 * - userId: MySQL user ID of the requesting user
 * 
 * Response: Array of user objects with friendship details
 * [
 *   {
 *     id: number,           // Friend's user ID
 *     name: string,         // Friend's display name
 *     email: string,        // Friend's email
 *     pfp: string,          // Friend's profile picture URL
 *     bio: string,          // Friend's bio/description
 *     status: string,       // 'accepted' or 'pending'
 *     requester_id: number, // ID of user who sent the request
 *     receiver_id: number,  // ID of user who received the request
 *     created_at: Timestamp // When friendship was created
 *   }
 * ]
 * 
 * Use Case:
 * - Display all friend connections in user profile
 * - Show both confirmed friends and pending requests
 */
router.get('/:userId', async (req, res) => {
    // Extract user ID from URL parameters
    const { userId } = req.params;
    
    // Complex SQL query with JOIN to fetch friends with bidirectional support
    const query = `
        SELECT u.id, u.name, u.email, u.pfp, u.bio, f.status, f.requester_id, f.receiver_id, f.created_at
        FROM users u
        JOIN friends f ON (
            -- Match if requesting user sent the friend request
            (f.requester_id = ? AND f.receiver_id = u.id)
            OR
            -- OR match if requesting user received the friend request
            (f.receiver_id = ? AND f.requester_id = u.id)
        )
        -- Include both accepted friendships and pending requests
        WHERE f.status IN ('accepted','pending')
    `;
    
    /*
     * Query Explanation:
     * 
     * 1. SELECT u.*, f.*
     *    - Get user profile fields from users table
     *    - Get friendship metadata from friends table
     * 
     * 2. JOIN friends f ON (bidirectional match)
     *    - Handles friendships in BOTH directions
     *    - Works regardless of who initiated the friend request
     * 
     * 3. WHERE f.status IN ('accepted','pending')
     *    - Includes both confirmed friends and pending requests
     *    - Excludes rejected or cancelled relationships
     */
    
  try {
    // Execute query (userId passed twice for both OR conditions)
    const [rows] = await db.query(query, [userId, userId]);
    
    // Convert any Buffer objects to strings before sending response
    // MySQL sometimes returns BINARY/VARBINARY fields as Buffer objects
    res.json(deBuffer(rows));
  } catch (err) {
    // Handle database errors
    res.status(500).send(err);
  }
});

// ========================================
// GET PENDING FRIEND REQUESTS
// ========================================

/**
 * GET /friends/pending/:userId
 * Retrieves all pending friend requests (both sent and received)
 * Useful for displaying friend request notifications
 * 
 * URL Parameters:
 * - userId: MySQL user ID of the requesting user
 * 
 * Response: Array of user objects with pending request details
 * 
 * Use Case:
 * - Display pending friend requests in notification center
 * - Show both requests user sent and requests they received
 * - Allow user to accept/reject incoming requests
 */
router.get('/pending/:userId', async (req, res) => {
    // Extract user ID from URL parameters
    const { userId } = req.params;
    
    // SQL query similar to above, but filtered to only pending status
    const query = `
        SELECT u.id, u.name, u.email, u.pfp, u.bio, f.status, f.requester_id, f.receiver_id, f.created_at
        FROM users u
        JOIN friends f ON (
            -- Match if requesting user sent the friend request
            (f.requester_id = ? AND f.receiver_id = u.id)
            OR
            -- OR match if requesting user received the friend request
            (f.receiver_id = ? AND f.requester_id = u.id)
        )
        -- Only include pending requests (not accepted)
        WHERE f.status = 'pending'
    `;
    
    /*
     * Key Difference from Previous Route:
     * - WHERE clause filters to ONLY 'pending' status
     * - Excludes already accepted friendships
     * - Returns requests in both directions (sent and received)
     */
    
  try {
    // Execute query
    const [rows] = await db.query(query, [userId, userId]);
    
    // Convert Buffer objects to strings
    res.json(deBuffer(rows));
  } catch (err) {
    // Handle database errors
    res.status(500).send(err);
  }
});

// ========================================
// GET ACCEPTED FRIENDS ONLY
// ========================================

/**
 * GET /friends/accepted/:userId
 * Retrieves only confirmed/accepted friendships
 * Excludes pending requests
 * 
 * URL Parameters:
 * - userId: MySQL user ID of the requesting user
 * 
 * Response: Array of user objects representing confirmed friends
 * 
 * Use Case:
 * - Display user's friend list
 * - Show only confirmed friendships (not pending requests)
 * - Populate messaging contacts list
 * - Show friends' calendar events
 */
router.get('/accepted/:userId', async (req, res) => {
    // Extract user ID from URL parameters
    const { userId } = req.params;
    
    // SQL query filtered to only accepted friendships
    const query = `
        SELECT u.id, u.name, u.email, u.pfp, u.bio, f.status, f.requester_id, f.receiver_id, f.created_at
        FROM users u
        JOIN friends f ON (
            -- Match if requesting user sent the friend request
            (f.requester_id = ? AND f.receiver_id = u.id)
            OR
            -- OR match if requesting user received the friend request
            (f.receiver_id = ? AND f.requester_id = u.id)
        )
        -- Only include accepted friendships
        WHERE f.status = 'accepted'
    `;
    
    /*
     * Key Difference from Previous Routes:
     * - WHERE clause filters to ONLY 'accepted' status
     * - Excludes pending requests
     * - Returns only confirmed, active friendships
     */
    
  try {
    // Execute query
    const [rows] = await db.query(query, [userId, userId]);
    
    // Convert Buffer objects to strings
    res.json(deBuffer(rows));
  } catch (err) {
    // Handle database errors with more detailed logging
    console.error("Error fetching accepted friends:", err);
    res.status(500).send(err);
  }
});

// ========================================
// SEND FRIEND REQUEST
// ========================================

/**
 * POST /friends/request
 * Creates a new friend request from one user to another
 * Validates that friendship doesn't already exist
 * 
 * Request Body:
 * - requesterId: MySQL ID of user sending the request
 * - receiverId: MySQL ID of user receiving the request
 * 
 * Response: Success message or error
 * 
 * Business Logic:
 * - Prevents duplicate friend requests
 * - Checks for existing friendships in BOTH directions
 * - Creates new friendship record with 'pending' status
 */
router.post('/request', async (req, res) => {
    // Extract requester and receiver IDs from request body
    const { requesterId, receiverId } = req.body;
    
    // ========================================
    // Validation: Check required fields
    // ========================================
    
    // Ensure both IDs are provided
    if (!requesterId || !receiverId) {
      return res.status(400).json({ error: "Missing requesterId or receiverId" });
    }

    // ========================================
    // Check for existing friendship
    // ========================================
    
    // Query to check if any friendship exists between these users
    // Checks BOTH directions to prevent duplicate relationships
    const [existing] = await db.query(
      `SELECT * FROM friends 
       WHERE (requester_id = ? AND receiver_id = ?) 
          OR (receiver_id = ? AND requester_id = ?)`,
      [requesterId, receiverId, requesterId, receiverId]
    );
    
    // If any relationship exists (pending, accepted, etc.), reject the request
    if (existing.length > 0) {
      return res.status(400).json({ error: "Friendship already exists" });
    }

    // ========================================
    // Create new friend request
    // ========================================
    
    // SQL query to insert new friend request with 'pending' status
    const req_query = `
        INSERT INTO friends (requester_id, receiver_id, status)
        VALUES (?, ?, 'pending')
    `;

  try {
    // Execute INSERT query
    await db.query(req_query, [requesterId, receiverId]);
    
    // Send success response
    res.json({ message: 'Friend request sent' });
  } catch (err) {
    // Handle database errors (e.g., foreign key constraint violations)
    res.status(500).send(err);
  }
});

// ========================================
// CANCEL FRIEND REQUEST
// ========================================

/**
 * POST /friends/cancelReq
 * Cancels a pending friend request that was sent by the user
 * Only works for requests with 'pending' status
 * 
 * Request Body:
 * - requesterId: MySQL ID of user who sent the original request
 * - receiverId: MySQL ID of user who received the request
 * 
 * Response: Success message or error if request not found
 * 
 * Use Case:
 * - Allow user to cancel friend requests they sent
 * - Remove unwanted pending requests
 * - Cannot cancel accepted friendships (use unfriend instead)
 */
router.post("/cancelReq", async (req, res) => {
  // Extract requester and receiver IDs from request body
  const { requesterId, receiverId } = req.body;

  // SQL query to delete ONLY pending requests
  // WHERE clause ensures:
  // 1. Correct direction (requester -> receiver)
  // 2. Status is 'pending' (not accepted)
  const cancel_query = `
    DELETE FROM friends 
    WHERE requester_id = ? AND receiver_id = ? AND status = 'pending'
  `;

  try {
    // Execute DELETE query
    const [result] = await db.query(cancel_query, [requesterId, receiverId]);
    
    // Check if any rows were deleted
    // affectedRows = 0 means no matching pending request was found
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No pending request found" });
    }
    
    // Send success response
    res.json({ message: "Friend request cancelled" });
  } catch (err) {
    // Handle database errors
    res.status(500).json({ error: err.message });
  }
});

// ========================================
// ACCEPT FRIEND REQUEST
// ========================================

/**
 * POST /friends/accept
 * Accepts a pending friend request
 * Changes status from 'pending' to 'accepted'
 * 
 * Request Body:
 * - requesterId: MySQL ID of user who sent the original request
 * - receiverId: MySQL ID of user who received the request (current user)
 * 
 * Response: Success message or error if request not found
 * 
 * Business Logic:
 * - Only the receiver can accept a request
 * - Updates existing friendship record (doesn't create new one)
 * - Maintains directional relationship (requester -> receiver)
 */
router.post('/accept', async (req, res) => {
    // Extract requester and receiver IDs from request body
    const { requesterId, receiverId } = req.body;
    
    // SQL query to update friendship status to 'accepted'
    // WHERE clause ensures:
    // 1. Correct direction (requester -> receiver)
    // 2. Current status is 'pending' (not already accepted)
    const accept_query = `
      UPDATE friends 
      SET status = 'accepted'
      WHERE requester_id = ? AND receiver_id = ? 
      AND status = 'pending'
    `;
    
  try {
    // Execute UPDATE query
    const [result] = await db.query(accept_query, [requesterId, receiverId]);

    // Check if any rows were updated
    // affectedRows = 0 means no matching pending request was found
    if(result.affectedRows === 0) {
      return res.status(404).json({ error: "No pending request found" });
    }
    
    // Send success response
    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    // Handle database errors
    res.status(500).send(err);
  }
});

// ========================================
// REJECT FRIEND REQUEST
// ========================================

/**
 * POST /friends/reject
 * Rejects a pending friend request
 * Deletes the friendship record entirely
 * 
 * Request Body:
 * - requesterId: MySQL ID of user who sent the original request
 * - receiverId: MySQL ID of user who received the request (current user)
 * 
 * Response: Success message or error if request not found
 * 
 * Business Logic:
 * - Only the receiver can reject a request
 * - Deletes friendship record (vs updating status)
 * - Allows same users to send new requests in the future
 * - Different from unfriend (which removes accepted friendships)
 */
router.post('/reject', async (req, res) => {
    // Extract requester and receiver IDs from request body
    const { requesterId, receiverId } = req.body;
    
    // SQL query to delete pending friend request
    // WHERE clause ensures:
    // 1. Correct direction (requester -> receiver)
    // 2. Status is 'pending' (not accepted)
    const reject_query = `
      DELETE FROM friends 
      WHERE requester_id = ? AND receiver_id = ? 
      AND status = 'pending'
    `;
    
  try {
    // Execute DELETE query
    const [result] = await db.query(reject_query, [requesterId, receiverId]);

    // Check if any rows were deleted
    // affectedRows = 0 means no matching pending request was found
    if(result.affectedRows === 0) {
      return res.status(404).json({ error: "No pending request found" });
    }
    
    // Send success response
    res.json({ message: 'Friend request rejected' });
  } catch (err) {
    // Handle database errors
    res.status(500).send(err);
  }
});

// ========================================
// UNFRIEND / REMOVE FRIENDSHIP
// ========================================

/**
 * POST /friends/unfriend
 * Removes an existing friendship between two users
 * Works for accepted friendships in BOTH directions
 * 
 * Request Body:
 * - userId: MySQL ID of current user
 * - friendId: MySQL ID of friend to remove
 * 
 * Response: Success message or error if friendship not found
 * 
 * Business Logic:
 * - Removes accepted friendships (not pending requests)
 * - Checks BOTH directions (either user could be requester/receiver)
 * - Deletes friendship record entirely
 * - Different from reject (which only handles pending requests)
 * 
 * Use Case:
 * - Allow users to end friendships
 * - Remove friends from friend list
 * - Stop sharing calendar events with unfriended user
 */
router.post("/unfriend", async (req, res) => {
  // Extract user IDs from request body
  const { userId, friendId } = req.body;
  
  // SQL query to delete friendship in BOTH directions
  // Handles bidirectional relationships regardless of who initiated
  const unfriend_quey = `
      DELETE FROM friends
      WHERE (requester_id = ? AND receiver_id = ?)
      OR (receiver_id = ? AND requester_id = ?)
    `;
    
  /*
   * Query Explanation:
   * 
   * Checks both possible relationship directions:
   * 1. userId is requester, friendId is receiver
   * 2. userId is receiver, friendId is requester
   * 
   * This ensures unfriend works regardless of:
   * - Who sent the original friend request
   * - Which user initiates the unfriend action
   */
    
  try {
    // Execute DELETE query (userId and friendId passed twice for both OR conditions)
    const [result] = await db.query(unfriend_quey, [userId, friendId, userId, friendId]);

    // Check if any rows were deleted
    // affectedRows = 0 means no friendship exists between these users
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "No friendship found" });
    }

    // Send success response
    res.json({ message: "Unfriended successfully" });
  } catch (err) {
    // Handle database errors
    res.status(500).json({ error: err.message });
  }
});

// Export router to be mounted in main server file
export default router;
