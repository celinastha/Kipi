import express from "express";
import admin from "../Firebase/firebaseAdmin.js";
import db from "../MySQL/db.js";

const router = express.Router();

function randomColor() {
  const colors = [
    "0D8ABC", "6ab04c", "e17055", "0984e3", "d63031", "fd79a8", "00cec9"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  console.log("Received backend: ", {name, email});
  try {

    // Check if user already exists in Firebase
    try {
      await admin.auth().getUserByEmail(email);
      return res.status(400).json({ error: 'Email already in use' });
    } catch (err) {
      if (err.code !== 'auth/user-not-found') {
        return res.status(500).json({ error: 'Firebase lookup failed' });
      }
    }

    //Create User in Firebase
    const userRecord = await admin.auth().createUser(
    { 
      email, 
      password, 
      displayName:name,
    });
    console.log("Created user in Firebase:", { displayName: name });

    //Get full user info
    const fullUser = await admin.auth().getUser(userRecord.uid);
    const firebase_uid = fullUser.uid;
    const bg = randomColor();
    const pfp = `https://avatar.oxro.io/avatar.svg?name=${encodeURIComponent(name)}&background=${bg}&color=fff`;

  
    //Save to MySQL
    const insertQuery = `INSERT INTO users (firebase_uid, email, name, pfp)
                        VALUES (?, ?, ?, ?)`;
    try{
      await db.query(insertQuery, [firebase_uid, fullUser.email, fullUser.displayName, pfp]);
    } catch (err) {
      console.error('MySQL insert error:', err);
      await admin.auth().deleteUser(firebase_uid);
      return res.status(500).json({ error: 'Failed to save user in MySQL' });
    }
    
    const [rows] = await db.query("SELECT id FROM users WHERE firebase_uid = ?", [firebase_uid]);
    const currentUserId = rows[0].id;

    res.status(201).json({
      message: "User created and synced",
      email: fullUser.email,
      name: fullUser.displayName,
      currentUserId, // ✅ return MySQL id
      pfp,
    });


  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );
    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });

    const userInfo = await admin.auth().getUser(data.localId);
    const name = userInfo.displayName;
    console.log("Login backend sending to front name: ", name);

    const [rows] = await db.query(
      "SELECT id FROM users WHERE firebase_uid = ?",
      [data.localId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found in MySQL" });
    }
    const currentUserId = rows[0].id;

    res.json({ token: data.idToken, email: data.email, name, currentUserId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/logout", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    await admin.auth().revokeRefreshTokens(decoded.uid);
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout failed:", err.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

router.put("/update-profile", async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  const { displayName, email, newPassword } = req.body;

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;

    const currentUser = await admin.auth().getUser(uid);

    const updateData = {};
    
    if (displayName && displayName !== currentUser.displayName) {
      updateData.displayName = displayName;
    }
    
    if (email && email !== currentUser.email) {
      updateData.email = email;
    }
    
    if (newPassword) {
      updateData.password = newPassword;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No changes to update" });
    }

    await admin.auth().updateUser(uid, updateData);

     // Update MySQL 
    const sql = `
      UPDATE users 
      SET name = COALESCE(?, name),
          email = COALESCE(?, email)
      WHERE firebase_uid = ?
    `;
    await db.query(sql, [displayName || null, email || null, uid]);


    const updatedUser = await admin.auth().getUser(uid);

    res.json({ 
      message: "Profile updated successfully",
      name: updatedUser.displayName,
      email: updatedUser.email
    });

  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: error.message || "Failed to update profile" });
  }
});

export default router;
