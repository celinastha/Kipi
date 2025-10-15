import express from "express";
import admin from "../Firebase/firebaseAdmin.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;



router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  console.log("Received backend: ", {name, email});
  try {
    const userRecord = await admin.auth().createUser({ email, password, displayName:name, });
    console.log("Sent to Firebase:", { displayName: name });

    const fullUser = await admin.auth().getUser(userRecord.uid);

    const token = jwt.sign(
        { uid: fullUser.uid, email: fullUser.email, name: fullUser.displayName }, 
        JWT_SECRET,
        { expiresIn: "2h",}
    );

    console.log("Signup backend name:", fullUser.displayName);

    res.status(201).json({ token, email: fullUser.email, name: fullUser.displayName });
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

    const token = jwt.sign(
        { uid: data.localId, email: data.email, name }, 
        JWT_SECRET,
        { expiresIn: "2h", }
    );
    console.log("Login: returning name:", name);
    res.json({ token, email: data.email, name });
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
    const decoded = jwt.verify(token, JWT_SECRET);
    await admin.auth().revokeRefreshTokens(decoded.uid);
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout failed:", err.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});




// Middleware
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};



// Protected route
router.get("/profile", verifyJWT, (req, res) => {
  res.json({ message: `Hello, ${req.user.email}` });
});

export default router;
