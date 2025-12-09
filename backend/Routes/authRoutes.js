import express from "express";
import admin from "../Firebase/firebaseAdmin.js";
import db from "../MySQL/db.js";

// Create Express router instance for authentication-related routes
const router = express.Router();

// UTILITY FUNCTIONS

/**
 * Generates a random hex color code for user avatar backgrounds
 * Selects from a predefined palette of vibrant colors
 * @returns {string} - Hex color code without '#' prefix
 */
function randomColor() {
  const colors = [
    "0D8ABC", // Blue
    "6ab04c", // Green
    "e17055", // Orange
    "0984e3", // Light Blue
    "d63031", // Red
    "fd79a8", // Pink
    "00cec9"  // Teal
  ];
  // Return random color from array
  return colors[Math.floor(Math.random() * colors.length)];
}

// SIGNUP ROUTE

/**
 * POST /auth/signup
 * Registers a new user in both Firebase Authentication and MySQL database
 * Creates user profile with auto-generated avatar
 */
router.post("/signup", async (req, res) => {
  // Extract user registration data from request body
  const { name, email, password } = req.body;
  console.log("Received backend: ", {name, email});
  
  try {
    // STEP 1: Check if user already exists
    
    // Attempt to find existing user by email in Firebase
    try {
      await admin.auth().getUserByEmail(email);
      // If user found, email is already in use
      return res.status(400).json({ error: 'Email already in use' });
    } catch (err) {
      // If error is NOT "user-not-found", something went wrong with Firebase
      if (err.code !== 'auth/user-not-found') {
        return res.status(500).json({ error: 'Firebase lookup failed' });
      }
      // If error IS "user-not-found", proceed with registration (this is expected)
    }

    // STEP 2: Create user in Firebase Authentication
    
    // Create new Firebase user with email, password, and display name
    const userRecord = await admin.auth().createUser({ 
      email, 
      password, 
      displayName: name,
    });
    console.log("Created user in Firebase:", { displayName: name });

    // STEP 3: Generate user profile data
    
    // Retrieve complete user information from Firebase
    const fullUser = await admin.auth().getUser(userRecord.uid);
    const firebase_uid = fullUser.uid;
    
    // Generate random background color for avatar
    const bg = randomColor();
    
    // Create avatar URL using third-party service (oxro.io)
    // Generates SVG avatar with user's initials on colored background
    const pfp = `https://avatar.oxro.io/avatar.svg?name=${encodeURIComponent(name)}&background=${bg}&color=fff`;

    // STEP 4: Save user to MySQL database
    
    // Insert user record into MySQL users table
    const insertQuery = `INSERT INTO users (firebase_uid, email, name, pfp)
                        VALUES (?, ?, ?, ?)`;
    try {
      await db.query(insertQuery, [firebase_uid, fullUser.email, fullUser.displayName, pfp]);
    } catch (err) {
      // If MySQL insert fails, rollback Firebase user creation
      console.error('MySQL insert error:', err);
      await admin.auth().deleteUser(firebase_uid);
      return res.status(500).json({ error: 'Failed to save user in MySQL' });
    }
    
    // STEP 5: Retrieve MySQL user ID
    
    // Query MySQL to get the auto-generated internal user ID
    const [rows] = await db.query("SELECT id FROM users WHERE firebase_uid = ?", [firebase_uid]);
    const currentUserId = rows[0].id;

    // STEP 6: Return success response
    
    // Send user data back to client
    res.status(201).json({
      message: "User created and synced",
      email: fullUser.email,
      name: fullUser.displayName,
      currentUserId, // MySQL internal ID (used for friend relationships, etc.)
      pfp, // Avatar URL
    });

  } catch (error) {
    // Handle any unexpected errors during signup process
    console.error('Signup error:', error);
    res.status(400).json({ error: error.message });
  }
});

// LOGIN ROUTE

/**
 * POST /auth/login
 * Authenticates user credentials via Firebase and returns JWT token
 * Also retrieves MySQL user ID for application-level operations
 */
router.post("/login", async (req, res) => {
  // Extract login credentials from request body
  const { email, password } = req.body;
  
  try {
    // STEP 1: Authenticate with Firebase
    
    // Call Firebase REST API to verify email/password
    // Using REST API instead of Admin SDK for password verification
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );
    
    // Parse Firebase response
    const data = await response.json();
    
    // Check if authentication failed
    if (data.error) return res.status(400).json({ error: data.error.message });

    // STEP 2: Retrieve user information
    
    // Get user details from Firebase using localId (Firebase UID)
    const userInfo = await admin.auth().getUser(data.localId);
    const name = userInfo.displayName;
    console.log("Login backend sending to front name: ", name);

    // STEP 3: Get MySQL user ID
    
    // Query MySQL to find internal user ID using Firebase UID
    const [rows] = await db.query(
      "SELECT id FROM users WHERE firebase_uid = ?",
      [data.localId]
    );
    
    // Verify user exists in MySQL database
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found in MySQL" });
    }
    const currentUserId = rows[0].id;

    // STEP 4: Return authentication data
    
    // Send JWT token and user data to client
    res.json({ 
      token: data.idToken,      // Firebase JWT token for authenticated requests
      email: data.email,        // User email
      name,                     // User display name
      currentUserId             // MySQL internal ID
    });
    
  } catch (err) {
    // Handle any errors during login process
    res.status(500).json({ error: err.message });
  }
});

// LOGOUT ROUTE

/**
 * POST /auth/logout
 * Invalidates user's Firebase session by revoking refresh tokens
 * Requires valid JWT token in Authorization header
 */
router.post("/logout", async (req, res) => {
  // STEP 1: Extract and validate token
  
  // Get Authorization header from request
  const authHeader = req.headers.authorization;
  
  // Check if Authorization header exists and has correct format
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  
  // Extract JWT token (remove "Bearer " prefix)
  const token = authHeader.split(" ")[1];
  
  try {
    // STEP 2: Verify token and revoke refresh tokens
    
    // Verify JWT token is valid and not expired
    const decoded = await admin.auth().verifyIdToken(token);
    
    // Revoke all refresh tokens for this user
    // This forces user to re-authenticate on all devices
    await admin.auth().revokeRefreshTokens(decoded.uid);
    
    // Send success response
    res.json({ message: "Logged out successfully" });
    
  } catch (err) {
    // Handle invalid or expired token
    console.error("Logout failed:", err.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

// UPDATE PROFILE ROUTE

/**
 * PUT /auth/update-profile
 * Updates user profile information in both Firebase and MySQL
 * Allows changing display name, email, and password
 * Requires valid JWT token in Authorization header
 */
router.put("/update-profile", async (req, res) => {
  // STEP 1: Extract and validate token
  
  // Get Authorization header from request
  const authHeader = req.headers.authorization;
  
  // Check if Authorization header exists and has correct format
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  // Extract JWT token (remove "Bearer " prefix)
  const token = authHeader.split(" ")[1];
  
  // Extract update fields from request body
  const { displayName, email, newPassword } = req.body;

  try {
    // STEP 2: Verify token and get user
    
    // Verify JWT token is valid and decode user information
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;

    // Retrieve current user data from Firebase
    const currentUser = await admin.auth().getUser(uid);

    // STEP 3: Build update object
    
    // Create object to hold only fields that have changed
    const updateData = {};
    
    // Add displayName to update if provided and different from current
    if (displayName && displayName !== currentUser.displayName) {
      updateData.displayName = displayName;
    }
    
    // Add email to update if provided and different from current
    if (email && email !== currentUser.email) {
      updateData.email = email;
    }
    
    // Add password to update if provided
    // Note: we don't check current password (no comparison possible)
    if (newPassword) {
      updateData.password = newPassword;
    }

    // STEP 4: Validate changes exist
    
    // If no fields changed, return error (nothing to update)
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No changes to update" });
    }

    // STEP 5: Update Firebase user
    
    // Update user in Firebase Authentication
    await admin.auth().updateUser(uid, updateData);

    // STEP 6: Update MySQL database
    
    // Update user record in MySQL database
    // COALESCE keeps existing value if new value is NULL
    const sql = `
      UPDATE users 
      SET name = COALESCE(?, name),
          email = COALESCE(?, email)
      WHERE firebase_uid = ?
    `;
    await db.query(sql, [displayName || null, email || null, uid]);

    // STEP 7: Return updated user data
    
    // Retrieve updated user information from Firebase
    const updatedUser = await admin.auth().getUser(uid);

    // Send success response with updated data
    res.json({ 
      message: "Profile updated successfully",
      name: updatedUser.displayName,
      email: updatedUser.email
    });

  } catch (error) {
    // Handle any errors during profile update
    console.error("Update profile error:", error);
    res.status(500).json({ error: error.message || "Failed to update profile" });
  }
});

// Export router to be mounted in main server file
export default router;
