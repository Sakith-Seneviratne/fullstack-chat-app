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

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

export function getGroupMemberSocketIds(memberIds) {
  return memberIds
    .map(memberId => userSocketMap[memberId.toString()])
    .filter(socketId => socketId);
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    
    // Join user to their own room for group messaging
    socket.join(userId);
  }

  // io.emit() is used to send events to all the connected clients
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

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  // When user reads messages
socket.on("messages:read", async ({ messageIds, chatId, isGroup }) => {
  try {
    const userId = socket.userId; // Assuming you set this during socket authentication

    // Update messages in database
    await Message.updateMany(
      {
        _id: { $in: messageIds },
        senderId: { $ne: userId }, // Don't mark own messages
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
      // For groups, broadcast to all group members
      socket.to(chatId).emit("messages:read:update", {
        messageIds,
        readBy: userId,
        readAt: new Date(),
        chatId,
      });
    } else {
      // For 1-on-1, send to the specific user
      const recipientSocketId = getRecipientSocketId(chatId); // You need this helper
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

// Handle chat opened event (automatically mark visible messages as read)
socket.on("chat:opened", async ({ chatId, isGroup }) => {
  try {
    const userId = socket.userId;

    // Find recent unread messages
    const query = isGroup
      ? { group: chatId, senderId: { $ne: userId }, "readBy.user": { $ne: userId } }
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
});

export { io, app, server };