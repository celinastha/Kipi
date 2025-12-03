import express from 'express'
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import authRoutes from './Routes/authRoutes.js'
import protectedRoutes from './Routes/protected.js'
import userRoutes from './Routes/userRoutes.js'
import friendRoutes from './Routes/friendRoutes.js'
import calenderRoutes from './Routes/calenderRoutes.js'
//import conversationRoutes from './Routes/conversationRoutes.js'
import { Server as SocketIOServer } from 'socket.io'

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173", // frontend dev server
    credentials: true,
  },
});

app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes); 
app.use('/users', userRoutes);
app.use('/friends', friendRoutes);
app.use('/calender', calenderRoutes);
//app.use("/conversations", conversationRoutes(io));


const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
