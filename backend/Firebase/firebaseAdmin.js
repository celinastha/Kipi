import admin from "firebase-admin";
import dotenv from "dotenv";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
dotenv.config();

const serviceAccount = require("./FirebaseServiceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export default admin;