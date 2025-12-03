import express from "express";
import admin from "../Firebase/firebaseAdmin.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  console.log("Received backend: ", {name, email});
  try {
    const userRecord = await admin.auth().createUser({ email, password, displayName:name, });
    console.log("Sent to Firebase:", { displayName: name });

    const fullUser = await admin.auth().getUser(userRecord.uid);

    console.log("Signup backend name:", fullUser.displayName);

    res.status(201).json({ message: "User created", email: fullUser.email, name: fullUser.displayName });
  } catch (error) {
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

    res.json({ token: data.idToken, email: data.email, name });
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
