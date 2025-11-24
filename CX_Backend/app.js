const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const userRouter = require("./routes/userRouter");
const authRouter = require("./routes/authRouter");
const postRouter = require("./routes/postRouter");
const chatRoutes = require("./routes/chatRoutes"); // Fixed typo from 'charRoutes' to 'chatRoutes'
const notificationRouter = require("./routes/notificationRouter");
const { startServer } = require("./connection/DB");
require("./cron/cleanupUnverifiedUsers");
const setupSocket = require('./socket');  // Add socket setup function

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 4444;
const server = http.createServer(app);

// Attach server instance to app for socket setup
app.set("server", server);

// 🌐 Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173", // Make sure to replace with your frontend URL
  credentials: true,
}));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 🛣️ API Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/post", postRouter);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/notifications", notificationRouter);

// 🔁 Base Route
app.get("/", (req, res) => {
  res.send("✅ Backend working perfectly");
});

// Setup Socket.IO for real-time communication
const io = setupSocket(server);
app.set("io", io);

// 🚀 Start Server
startServer().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});
