import { Router } from 'express';
import express from 'express';
import admin from '../Firebase/firebaseAdmin.js';
import db from "../MySQL/db.js";

const router = Router();

// ========================================
// USER RETRIEVAL ROUTES
// ========================================

/**
 * GET /users/all
 * Retrieves all users in the system (no authentication required)
 * Returns basic user profile information
 */
router.get('/all', async (req, res) => {
    const userQuery = `
        SELECT id, name, email, pfp, bio FROM users
    `;
    try {
        const [rows] = await db.query(userQuery);
        res.json(rows);
    } catch (err) {
        res.status(500).send(err);
    }
});

/**
 * GET /users/all/:currentUserId
 * Retrieves all users EXCEPT current user, with friendship status
 * Uses LEFT JOIN to include friendship metadata if it exists
 * 
 * Response includes:
 * - User profile data
 * - Friendship status (null if no relationship exists)
 * - Who initiated the friendship (requester_id, receiver_id)
 * 
 * Use Case: User search/discovery with friend status indicators
 */
router.get('/all/:currentUserId', async (req, res) => {
    const { currentUserId } = req.params;
    
    // LEFT JOIN includes all users, with friendship data if available
    // Bidirectional friendship check handles both requester and receiver cases
    const userQuery = `
        SELECT  u.id, u.name, u.pfp, u.bio, f.status, f.requester_id, f.receiver_id
        FROM users u
        LEFT JOIN friends f
            ON (
            (f.requester_id = ? AND f.receiver_id = u.id)
            OR (f.receiver_id = ? AND f.requester_id = u.id)
            )
        WHERE u.id != ?
    `;
    
    try {
        // Pass currentUserId three times: twice for JOIN conditions, once for WHERE
        const [rows] = await db.query(userQuery, [currentUserId, currentUserId, currentUserId]);
        res.json(rows);
    } catch (err) {
        res.status(500).send(err);
    }
});

/**
 * GET /users/:currentUserId/:selectedUserId
 * Retrieves a specific user's profile with friendship status relative to current user
 * 
 * Use Case: View another user's profile with friend relationship context
 * Shows whether users are friends, have pending request, or no relationship
 */
router.get("/:currentUserId/:selectedUserId", async (req, res) => {
  const { currentUserId, selectedUserId } = req.params;
  
  try {
    // Same query as /all/:currentUserId but filtered to specific user
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.pfp, u.bio, f.status, f.requester_id, f.receiver_id
       FROM users u
       LEFT JOIN friends f
         ON (
           (f.requester_id = ? AND f.receiver_id = u.id)
           OR (f.receiver_id = ? AND f.requester_id = u.id)
         )
       WHERE u.id = ?`,
      [currentUserId, currentUserId, selectedUserId]
    );
    
    // Return 404 if user doesn't exist
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    
    // Return single user object (not array)
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /users/:id
 * Retrieves a single user's basic profile by ID
 * No friendship context included
 * 
 * Use Case: Simple profile lookup without relationship information
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, pfp, bio FROM users WHERE id = ?", 
      [id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).send(err);
  }
});

export default router;
