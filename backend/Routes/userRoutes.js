import { Router } from 'express';
import express from'express';
import admin from '../Firebase/firebaseAdmin.js';
import db from "../MySQL/db.js";

const router = Router();

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

router.get('/all/:currentUserId', async (req, res) => {
    const { currentUserId } = req.params;
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
        const [rows] = await db.query(userQuery, [currentUserId, currentUserId, currentUserId]);
        res.json(rows);
    } catch (err) {
        res.status(500).send(err);
    }
});


router.get("/:currentUserId/:selectedUserId", async (req, res) => {
  const { currentUserId, selectedUserId } = req.params;
  try {
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
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT id, name, email, pfp, bio FROM users WHERE id = ?", [id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).send(err);
  }
});


export default router;
