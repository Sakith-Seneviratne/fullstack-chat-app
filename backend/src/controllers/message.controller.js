import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const markMessagesAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user._id;

    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ message: "Invalid message IDs" });
    }

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        senderId: { $ne: userId }, // Don't mark own messages as read
      },
      {
        $addToSet: {
          readBy: { user: userId, readAt: new Date() },
        },
        isRead: true,
      }
    );

    res.status(200).json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    console.error("Error in markMessagesAsRead:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get unread message count for a specific chat
export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const count = await Message.countDocuments({
      $or: [
        { senderId: userId, receiverId: currentUserId },
      ],
      senderId: { $ne: currentUserId },
      "readBy.user": { $ne: currentUserId },
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error("Error in getUnreadCount:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
