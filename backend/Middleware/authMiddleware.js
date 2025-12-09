import admin from "../Firebase/firebaseAdmin.js";
import db from "../MySQL/db.js"

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const [rows] = await db.query("SELECT id FROM users WHERE firebase_uid = ?", [decodedToken.uid]);
    if (!rows.length) {
      return res.status(403).json({ error: "User not found" });
    }

    req.user = { id: rows[0].id };
    next();

  } catch (err) {
    console.error("Firebase token verification failed:", err.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

export default verifyFirebaseToken;