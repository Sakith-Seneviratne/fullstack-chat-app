import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

// Store online users
const userSocketMap = {}; // {userId: socketId}

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

export function getGroupMemberSocketIds(memberIds) {
  return memberIds
    .map(memberId => userSocketMap[memberId.toString()])
    .filter(socketId => socketId);
}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    socket.userId = userId; // Store userId on socket for later use
    
    // Join user to their own room
    socket.join(userId);
  }

  // Emit online users to all clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Join group rooms
  socket.on("joinGroup", (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`User ${userId} joined group ${groupId}`);
  });

  // Leave group rooms
  socket.on("leaveGroup", (groupId) => {
    socket.leave(`group_${groupId}`);
    console.log(`User ${userId} left group ${groupId}`);
  });

  // Handle marking messages as read
  socket.on("messages:read", async ({ messageIds, chatId, isGroup }) => {
    try {
      const userId = socket.userId;

      // Update messages in database
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          senderId: { $ne: userId },
        },
        {
          $addToSet: {
            readBy: { user: userId, readAt: new Date() },
          },
          isRead: true,
        }
      );

      // Emit to other users in the chat/group
      if (isGroup) {
        // For groups, broadcast to all group members in the room
        socket.to(`group_${chatId}`).emit("messages:read:update", {
          messageIds,
          readBy: userId,
          readAt: new Date(),
          chatId,
        });
      } else {
        // For 1-on-1, send to the specific user
        const recipientSocketId = getReceiverSocketId(chatId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("messages:read:update", {
            messageIds,
            readBy: userId,
            readAt: new Date(),
            chatId,
          });
        }
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  });

  // Handle chat opened event
  socket.on("chat:opened", async ({ chatId, isGroup }) => {
    try {
      const userId = socket.userId;

      // Find recent unread messages
      const query = isGroup
        ? { groupId: chatId, senderId: { $ne: userId }, "readBy.user": { $ne: userId } }
        : {
            $or: [
              { senderId: chatId, receiverId: userId },
              { senderId: userId, receiverId: chatId },
            ],
            senderId: { $ne: userId },
            "readBy.user": { $ne: userId },
          };

      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(50);

      if (messages.length > 0) {
        const messageIds = messages.map((m) => m._id.toString());
        
        // Trigger the read event
        socket.emit("messages:read", { messageIds, chatId, isGroup });
      }
    } catch (error) {
      console.error("Error in chat:opened:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };