import express from 'express'
import dotenv from "dotenv";
import cors from "cors";
import authRoles from './Routes/authRoutes.js'

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());


app.use("/auth", authRoles);


// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
