// sockets/socketHandler.js
import { getRedisClient } from "../config/redis.js";
import { 
  registerUser, 
  unregisterUser 
} from "./socketHelpers.js";
import {
  handleLoadChatHistory,
  handleSendMessage
} from "./socketEvents.js";

export const initializeSocket = (io) => {
  const redis = getRedisClient();

  io.on("connection", (socket) => {
    console.log(`🔌 New socket connection: ${socket.id}`);

    // Register user
    socket.on("register", async ({ userId }) => {
      try {
        await registerUser(userId, socket.id);
        socket.userId = userId;
        console.log(`✅ User ${userId} registered with socket ${socket.id}`);
        
        // Subscribe to user's personal channel
        const subscriber = redis.duplicate();
        await subscriber.subscribe("chat:messages");
        
        subscriber.on("message", (channel, message) => {
          try {
            const data = JSON.parse(message);
            if (data.recipientId === userId) {
              const { messageData } = data;
              
              // Handle different message types
              if (messageData.type === "messageDeleted") {
                socket.emit("messageDeleted", {
                  messageId: messageData.messageId,
                  conversationId: messageData.conversationId
                });
                console.log(`🗑️ Notified user ${userId} of deleted message`);
              } else if (messageData.messageType === "image" || messageData.messageType === "video") {
                socket.emit("receiveMediaMessage", messageData);
                console.log(`📸 Delivered ${messageData.messageType} message to user ${userId}`);
              } else {
                socket.emit("receiveMessage", messageData);
                console.log(`📨 Delivered text message to user ${userId}`);
              }
            }
          } catch (error) {
            console.error("❌ Error processing Redis message:", error);
          }
        });

        socket.redisSubscriber = subscriber;
      } catch (error) {
        console.error("❌ Error registering user:", error);
        socket.emit("error", { message: "Failed to register user" });
      }
    });

    // Load chat history
    socket.on("loadChatHistory", async (data) => {
      await handleLoadChatHistory(socket, data);
    });

    // 🔥 NEW: Reload chat history when language changes
    socket.on("reloadChatHistory", async (data) => {
      console.log(`🌐 Reloading chat history for language change:`, data);
      await handleLoadChatHistory(socket, data);
    });

    // Send text message
    socket.on("sendMessage", async (data) => {
      await handleSendMessage(socket, data);
    });

    // Typing indicator
    socket.on("typing", async ({ conversationId, userId, isTyping }) => {
      try {
        socket.to(conversationId).emit("userTyping", {
          userId,
          conversationId,
          isTyping
        });
      } catch (error) {
        console.error("❌ Error handling typing:", error);
      }
    });

    // Join conversation room
    socket.on("joinConversation", async ({ conversationId }) => {
      socket.join(conversationId);
      console.log(`👥 User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on("leaveConversation", async ({ conversationId }) => {
      socket.leave(conversationId);
      console.log(`👋 User ${socket.userId} left conversation ${conversationId}`);
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      
      if (socket.redisSubscriber) {
        await socket.redisSubscriber.quit();
      }
      
      await unregisterUser(socket.id);
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error("❌ Socket error:", error);
    });
  });

  console.log("✅ Socket.IO initialized");
};