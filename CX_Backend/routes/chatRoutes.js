const express = require("express");
const router = express.Router();
const Message = require("../models/message");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const { verifyUser } = require("../controllers/userController");

// Get chat history with users (for chat list) - place BEFORE dynamic id routes to avoid conflicts
router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("🔍 Fetching chat history for user:", userId);

    // Get all unique users that the current user has chatted with
    const chatPartners = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { receiver: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $addFields: {
          chatPartner: {
            $cond: [
              { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
              "$receiver",
              "$sender"
            ]
          }
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: "$chatPartner",
          lastMessage: { $first: "$$ROOT" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $lookup: {
          from: "messages",
          let: { partnerId: "$_id", currentUserId: new mongoose.Types.ObjectId(userId) },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$sender", "$$partnerId"] },
                    { $eq: ["$receiver", "$$currentUserId"] },
                    { $eq: ["$isRead", false] }
                  ]
                }
              }
            }
          ],
          as: "unreadMessages"
        }
      },
      {
        $project: {
          _id: "$user._id",
          username: "$user.username",
          name: "$user.name",
          profilepic: "$user.profilepic",
          lastMessage: {
            content: "$lastMessage.content",
            timestamp: "$lastMessage.timestamp",
            sender: "$lastMessage.sender"
          },
          unreadCount: { $size: "$unreadMessages" }
        }
      },
      {
        $sort: { "lastMessage.timestamp": -1 }
      }
    ]);

    console.log("📋 Chat history result:", chatPartners.length, "conversations found");
    res.status(200).json(chatPartners);
  } catch (err) {
    console.error("❌ Error fetching chat history:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get chat history between two users
router.get("/:senderId/:receiverId", async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    }).sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test endpoint
router.get("/test", (req, res) => {
  res.json({ message: "Chat API is working!" });
});

// Send message + Emit real-time message
router.post("/", async (req, res) => {
  const { sender, receiver, content } = req.body;

  if (!sender || !receiver || !content) {
    return res.status(400).json({ error: "All fields are required." });
  }

  if (!mongoose.isValidObjectId(sender) || !mongoose.isValidObjectId(receiver)) {
    return res.status(400).json({ error: "Invalid sender or receiver ID." });
  }

  try {
    const senderExists = await User.exists({ _id: sender });
    const receiverExists = await User.exists({ _id: receiver });

    if (!senderExists || !receiverExists) {
      return res.status(404).json({ error: "Sender or receiver not found." });
    }

    const message = new Message({ sender, receiver, content });
    const saved = await message.save();

    // Create notification for message
    const Notification = require("../models/notification");
    const io = req.app.get("io");
    
    const notification = await Notification.create({
      sender: sender,
      receiver: receiver,
      type: "message",
      message: saved._id,
      content: content.substring(0, 100) // Store first 100 chars of message
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate("sender", "username profilepic")
      .populate("message", "content");

    // Emit real-time events
    io.to(receiver).emit("receive-message", saved);
    io.to(receiver).emit("new_notification", populatedNotification);
    io.to(sender).emit("receive-message", saved); // Optional: echo to sender

    res.status(201).json(saved);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: err.message });
  }
});

// Send message (new endpoint for authenticated users)
router.post("/send", verifyUser, async (req, res) => {
  const { receiverId, message, type, postId } = req.body;
  const senderId = req.user._id;

  if (!receiverId || !message) {
    return res.status(400).json({ error: "Receiver ID and message are required." });
  }

  if (!mongoose.isValidObjectId(receiverId)) {
    return res.status(400).json({ error: "Invalid receiver ID." });
  }

  try {
    const receiverExists = await User.exists({ _id: receiverId });

    if (!receiverExists) {
      return res.status(404).json({ error: "Receiver not found." });
    }

    const newMessage = new Message({ 
      sender: senderId, 
      receiver: receiverId, 
      content: message,
      type: type || "text",
      postId: postId || null
    });
    
    const saved = await newMessage.save();

    // Create notification for message
    const Notification = require("../models/notification");
    const io = req.app.get("io");
    
    const notification = await Notification.create({
      sender: senderId,
      receiver: receiverId,
      type: "message",
      message: saved._id,
      content: message.substring(0, 100)
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate("sender", "username profilepic")
      .populate("message", "content");

    // Emit real-time events
    io.to(receiverId).emit("receive-message", saved);
    io.to(receiverId).emit("new_notification", populatedNotification);

    res.status(201).json(saved);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get chat history for current user
router.get("/history", verifyUser, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("🔍 Fetching chat history for user:", userId);

    // Get all unique users that the current user has chatted with
    const chatPartners = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { receiver: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $addFields: {
          chatPartner: {
            $cond: [
              { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
              "$receiver",
              "$sender"
            ]
          }
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: "$chatPartner",
          lastMessage: { $first: "$$ROOT" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          _id: "$user._id",
          username: "$user.username",
          name: "$user.name",
          profilepic: "$user.profilepic",
          lastMessage: {
            content: "$lastMessage.content",
            timestamp: "$lastMessage.timestamp",
            sender: "$lastMessage.sender"
          }
        }
      },
      {
        $sort: { "lastMessage.timestamp": -1 }
      }
    ]);

    console.log("📋 Chat history result:", chatPartners.length, "conversations found");
    res.status(200).json(chatPartners);
  } catch (err) {
    console.error("❌ Error fetching chat history:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Mark messages as read when user opens a chat
router.put("/mark-read/:senderId/:receiverId", async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    await Message.updateMany(
      { sender: senderId, receiver: receiverId, isRead: false },
      { 
        $set: { 
          isRead: true, 
          readAt: new Date() 
        } 
      }
    );

    res.json({ message: "Messages marked as read" });
  } catch (err) {
    console.error("Error marking messages as read:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
