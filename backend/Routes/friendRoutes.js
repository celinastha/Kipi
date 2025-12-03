import { Router } from 'express';
import express from'express';
import admin from '../Firebase/firebaseAdmin.js';
import db from "../MySQL/db.js";

const router = Router();

router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    const query = `
        SELECT u.id, u.name, u.email, u.pfp, u.bio, f.status, f.requester_id, f.receiver_id, f.created_at
        FROM users u
        JOIN friends f ON (
        (f.requester_id = ? AND f.receiver_id = u.id)
        OR
        (f.receiver_id = ? AND f.requester_id = u.id)
        )
        WHERE f.status IN ('accepted','pending')
    `;
  try {
    const [rows] = await db.query(query, [userId, userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).send(err);
  }

});

router.get('/pending/:userId', async (req, res) => {
    const { userId } = req.params;
    const query = `
        SELECT u.id, u.name, u.email, u.pfp, u.bio, f.status, f.requester_id, f.receiver_id, f.created_at
        FROM users u
        JOIN friends f ON (
        (f.requester_id = ? AND f.receiver_id = u.id)
        OR
        (f.receiver_id = ? AND f.requester_id = u.id)
        )
        WHERE f.status = 'pending'
    `;
  try {
    const [rows] = await db.query(query, [userId, userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).send(err);
  }

});

router.get('/accepted/:userId', async (req, res) => {
    const { userId } = req.params;
    const query = `
        SELECT u.id, u.name, u.email, u.pfp, u.bio, f.status, f.requester_id, f.receiver_id, f.created_at
        FROM users u
        JOIN friends f ON (
        (f.requester_id = ? AND f.receiver_id = u.id)
        OR
        (f.receiver_id = ? AND f.requester_id = u.id)
        )
        WHERE f.status = 'accepted'
    `;
  try {
    const [rows] = await db.query(query, [userId, userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).send(err);
  }

});


router.post('/request', async (req, res) => {
    const { requesterId, receiverId } = req.body;
    if (!requesterId || !receiverId) {
      return res.status(400).json({ error: "Missing requesterId or receiverId" });
    }

    const [existing] = await db.query(
      `SELECT * FROM friends 
       WHERE (requester_id = ? AND receiver_id = ?) 
          OR (receiver_id = ? AND requester_id = ?)`,
      [requesterId, receiverId, requesterId, receiverId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Friendship already exists" });
    }

    const req_query = `
        INSERT INTO friends (requester_id, receiver_id, status)
        VALUES (?, ?, 'pending')
    `;

  try {
    await db.query(req_query, [requesterId, receiverId]);
    res.json({ message: 'Friend request sent' });
  } catch (err) {
    res.status(500).send(err);
  }

});

router.post("/cancelReq", async (req, res) => {
  const { requesterId, receiverId } = req.body;

  const cancel_query = `
    DELETE FROM friends 
    WHERE requester_id = ? AND receiver_id = ? AND status = 'pending'
  `;

  try {
    const [result] = await db.query(cancel_query, [requesterId, receiverId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No pending request found" });
    }
    res.json({ message: "Friend request cancelled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/accept', async (req, res) => {
    const { requesterId, receiverId } = req.body;
    const accept_query = `
      UPDATE friends 
      SET status = 'accepted'
      WHERE requester_id = ? AND receiver_id = ? 
      AND status = 'pending'
    `;
  try {
    const [result] = await db.query(accept_query, [requesterId, receiverId]);

    if(result.affectedRows === 0) return res.status(404).json({ error: "No pending request found" });
    
    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    res.status(500).send(err);
  }

});


router.post('/reject', async (req, res) => {
    const { requesterId, receiverId } = req.body;
    const reject_query = `
      DELETE FROM friends 
      WHERE requester_id = ? AND receiver_id = ? 
      AND status = 'pending'
    `;
  try {
    const [result] = await db.query(reject_query, [requesterId, receiverId]);

    if(result.affectedRows === 0) return res.status(404).json({ error: "No pending request found" });
    
    res.json({ message: 'Friend request rejected' });
  } catch (err) {
    res.status(500).send(err);
  }

});


router.post("/unfriend", async (req, res) => {
  const { userId, friendId } = req.body;
  const unfriend_quey = `
      DELETE FROM friends
      WHERE (requester_id = ? AND receiver_id = ?)
      OR (receiver_id = ? AND requester_id = ?)
    `;
  try {
    const [result] = await db.query(unfriend_quey, [userId, friendId, userId, friendId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "No friendship found" });
    }

    res.json({ message: "Unfriended successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;



