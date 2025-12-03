import { Router } from 'express';
import express from'express';
import db from "../MySQL/db.js";

const router = Router();

router.get('/create', async (req, res) => {
    const { creatorId, title, description, eventDate } = req.body;
    const query = `
        INSERT INTO calendar_events (creator_id, title, description, event_date)
        VALUES (?, ?, ?, ?)
    `;
    try {
        await db.query(query, [creatorId, title, description, eventDate]);
        res.json({ message: 'Event created successfully' });
    } catch (err) {
        res.status(500).send(err);
    }
});

router.get('/my/:userId', async (req, res) => {
    const { userId } = req.params;
    const query = `
        SELECT * FROM calendar_events WHERE creator_id = ? ORDER BY event_date ASC
    `;
    try {
        const [rows] = await db.query(query, [userId]);
        res.json(rows);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.get('/friends/:userId', async (req, res) => {
    const { userId } = req.params;
    const query = `
        SELECT ce.*
        FROM calendar_events ce
        JOIN friends f ON (
        (f.requester_id = ? AND f.receiver_id = ce.creator_id)
        OR
        (f.receiver_id = ? AND f.requester_id = ce.creator_id)
        )
        WHERE f.status = 'accepted'
        ORDER BY ce.event_date ASC

    `;
    try {
        const [rows] = await db.query(query, [userId, userId]);
        res.json(rows);
    } catch (err) {
        res.status(500).send(err);
    }
});
export default router;