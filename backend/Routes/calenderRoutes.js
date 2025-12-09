import { Router } from 'express';
import express from 'express';
import db from "../MySQL/db.js";

// Create Express router instance for calendar-related routes
const router = Router();

// ========================================
// CREATE EVENT ROUTE
// ========================================

/**
 * GET /calender/create
 * Creates a new calendar event for a user
 * Note: Should be POST method instead of GET for RESTful convention
 * 
 * Request body:
 * - creatorId: MySQL user ID of event creator
 * - title: Event title/name
 * - description: Detailed event description
 * - eventDate: Date and time of the event (ISO format or MySQL datetime)
 */
router.get('/create', async (req, res) => {
    // Extract event data from request body
    const { creatorId, title, description, eventDate } = req.body;
    
    // SQL query to insert new event into calendar_events table
    const query = `
        INSERT INTO calendar_events (creator_id, title, description, event_date)
        VALUES (?, ?, ?, ?)
    `;
    
    try {
        // Execute INSERT query with parameterized values to prevent SQL injection
        await db.query(query, [creatorId, title, description, eventDate]);
        
        // Send success response
        res.json({ message: 'Event created successfully' });
    } catch (err) {
        // Handle database errors (e.g., invalid data types, constraint violations)
        res.status(500).send(err);
    }
});

// ========================================
// GET USER'S OWN EVENTS ROUTE
// ========================================

/**
 * GET /calender/my/:userId
 * Retrieves all calendar events created by a specific user
 * Events are returned in chronological order (earliest first)
 * 
 * URL Parameters:
 * - userId: MySQL user ID of the event creator
 * 
 * Response: Array of event objects with all fields from calendar_events table
 */
router.get('/my/:userId', async (req, res) => {
    // Extract userId from URL parameters
    const { userId } = req.params;
    
    // SQL query to fetch all events created by this user
    // ORDER BY event_date ASC sorts events chronologically
    const query = `
        SELECT * FROM calendar_events WHERE creator_id = ? ORDER BY event_date ASC
    `;
    
    try {
        // Execute SELECT query
        // Destructure to get rows array (first element of query result)
        const [rows] = await db.query(query, [userId]);
        
        // Send array of event objects as JSON response
        res.json(rows);
    } catch (err) {
        // Handle database errors (e.g., connection issues, invalid query)
        res.status(500).send(err);
    }
});

// ========================================
// GET FRIENDS' EVENTS ROUTE
// ========================================

/**
 * GET /calender/friends/:userId
 * Retrieves all calendar events created by a user's accepted friends
 * Uses JOIN to filter events based on friendship status
 * 
 * URL Parameters:
 * - userId: MySQL user ID of the requesting user
 * 
 * Response: Array of event objects from all accepted friends
 * 
 * Business Logic:
 * - Only returns events from users who have an 'accepted' friendship
 * - Friendship can be in either direction (requester or receiver)
 * - Events sorted chronologically
 */
router.get('/friends/:userId', async (req, res) => {
    // Extract userId from URL parameters
    const { userId } = req.params;
    
    // Complex SQL query with JOIN to fetch friends' events
    const query = `
        SELECT ce.*
        FROM calendar_events ce
        JOIN friends f ON (
            -- Match if requesting user is the friend requester
            (f.requester_id = ? AND f.receiver_id = ce.creator_id)
            OR
            -- OR match if requesting user is the friend receiver
            (f.receiver_id = ? AND f.requester_id = ce.creator_id)
        )
        -- Only include events from accepted friendships
        WHERE f.status = 'accepted'
        -- Sort events chronologically (earliest first)
        ORDER BY ce.event_date ASC
    `;
    
    /*
     * Query Explanation:
     * 
     * 1. FROM calendar_events ce
     *    - Start with the calendar_events table (aliased as 'ce')
     * 
     * 2. JOIN friends f ON (...)
     *    - Join with friends table to filter based on relationships
     *    - The ON condition matches friends in BOTH directions:
     *      a) User is requester, friend is receiver (user sent friend request)
     *      b) User is receiver, friend is requester (user received friend request)
     * 
     * 3. WHERE f.status = 'accepted'
     *    - Only include events from accepted friendships
     *    - Filters out pending, rejected, or non-existent friendships
     * 
     * 4. ORDER BY ce.event_date ASC
     *    - Sort results by event date in ascending order
     * 
     * Example:
     * If User A (userId = 1) is friends with User B (userId = 2):
     * - Friendship could be stored as (requester=1, receiver=2) OR (requester=2, receiver=1)
     * - This query handles both cases and returns User B's events to User A
     */
    
    try {
        // Execute SELECT query
        // Pass userId twice because it's used in both OR conditions
        const [rows] = await db.query(query, [userId, userId]);
        
        // Send array of friends' event objects as JSON response
        res.json(rows);
    } catch (err) {
        // Handle database errors (e.g., connection issues, invalid query)
        res.status(500).send(err);
    }
});

// Export router to be mounted in main server file
export default router;
