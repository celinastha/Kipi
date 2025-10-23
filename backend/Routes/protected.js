import express from 'express'
import verifyFirebaseToken from '../Middleware/authMiddleware.js'

const router = express.Router();

router.use(verifyFirebaseToken);

router.get("/profile", (req, res) => {
  res.json({ message: "Welcome to your profile", user: req.user });
});

router.get("/search", (req, res) => {
  res.json({ message: "Secure search data", user: req.user });
});

router.get("/friends", (req, res) => {
  res.json({ message: "Secure friends data", user: req.user });
});

router.get("/messages", (req, res) => {
  res.json({ message: "Secure messages data", user: req.user });
});

router.get("/calender", (req, res) => {
  res.json({ message: "Secure calender data", user: req.user });
});

router.get("/notifications", (req, res) => {
  res.json({ message: "Secure notifications data", user: req.user });
});

export default router;
