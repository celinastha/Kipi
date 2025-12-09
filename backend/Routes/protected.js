import express from 'express'
import verifyFirebaseToken from '../Middleware/authMiddleware.js'

const router = express.Router();

// ========================================
// GLOBAL AUTHENTICATION MIDDLEWARE
// ========================================

/**
 * Apply Firebase JWT authentication to ALL routes below
 * Verifies token from Authorization header and attaches decoded user to req.user
 */
router.use(verifyFirebaseToken);

// ========================================
// PROTECTED ROUTES (AUTHENTICATION REQUIRED)
// ========================================

/**
 * GET /protected/profile
 * Returns authenticated user's profile information
 */
router.get("/profile", (req, res) => {
  res.json({ 
    message: "Welcome to your profile", 
    user: req.user  // Populated by verifyFirebaseToken middleware
  });
});

/**
 * GET /protected/search
 * Placeholder for authenticated search functionality
 * Intended for: searching users, events, conversations
 */
router.get("/search", (req, res) => {
  res.json({ 
    message: "Secure search data", 
    user: req.user 
  });
});

/**
 * GET /protected/friends
 * Placeholder for friends list access
 * Note: Actual friend functionality is in /friends routes
 */
router.get("/friends", (req, res) => {
  res.json({ 
    message: "Secure friends data", 
    user: req.user 
  });
});

/**
 * GET /protected/messages
 * Placeholder for messaging access
 * Note: Actual messaging is in /conversations routes and Socket.IO events
 */
router.get("/messages", (req, res) => {
  res.json({ 
    message: "Secure messages data", 
    user: req.user 
  });
});

/**
 * GET /protected/calender
 * Placeholder for calendar access
 * Note: Actual calendar functionality is in /calender routes
 */
router.get("/calender", (req, res) => {
  res.json({ 
    message: "Secure calender data", 
    user: req.user 
  });
});

/**
 * GET /protected/notifications
 * Placeholder for notifications (friend requests, event reminders, etc.)
 */
router.get("/notifications", (req, res) => {
  res.json({ 
    message: "Secure notifications data", 
    user: req.user 
  });
});

/*
 * ARCHITECTURE NOTE:
 * These are primarily stub routes for authentication testing.
 * Most functionality is implemented in dedicated route modules:
 * /auth, /users, /friends, /calender, /conversations
 */

export default router;
