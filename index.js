import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import { initializeTranslationClient } from "./config/translation.js";
import { initializeSocket } from "./sockets/socketHandler.js";
import authRoutes from "./routes/authRoutes.js";
import chats from "./routes/messageRoutes.js";
import userMediaRoutes from "./routes/userMediaRoutes.js";
// import mediaRoutes from "./routes/mediaRoutes.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from "fs";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "DELETE", "PUT"],
  credentials: true
}));

// Create uploads directory if not exists
if (!fs.existsSync('./uploads/temp')) {
  fs.mkdirSync('./uploads/temp', { recursive: true });
  console.log('✅ Created uploads/temp directory');
}

// Connect to databases and services
const initializeApp = async () => {
  await connectDB();
  await connectRedis();
  initializeTranslationClient();

  // Initialize Socket.IO
  initializeSocket(io);
};

initializeApp();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chats", chats);
app.use("/api/conv-media", userMediaRoutes);      // User avatar/cover routes
// app.use("/api/media", mediaRoutes);                // Message media routes

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    services: {
      mongodb: "connected",
      redis: "connected",
      cloudinary: "configured"
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export { io };