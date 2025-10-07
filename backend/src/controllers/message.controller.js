import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import path from "path"; // ADD THIS - Missing import
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (file, folder) => {
  try {
    const uploadResponse = await cloudinary.uploader.upload(file, {
      resource_type: "auto",
      folder: folder,
    });

    return {
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
      format: uploadResponse.format,
      bytes: uploadResponse.bytes,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

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
    }).populate("senderId", "fullName profilePic");

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    let fileData;

    // Handle image upload
    if (req.body.image) {
      const uploadResponse = await uploadToCloudinary(req.body.image, "chat-images");
      imageUrl = uploadResponse.url;
    }

    // Handle file upload
    if (req.body.file) {
      const uploadResponse = await uploadToCloudinary(req.body.file, "chat-files");
      
      const fileName = req.body.fileName || "file";
      const fileExtension = path.extname(fileName).slice(1) || uploadResponse.format;
      const fileType = req.body.fileType || `application/${fileExtension}`;
      const fileSize = uploadResponse.bytes;

      fileData = {
        url: uploadResponse.url,
        publicId: uploadResponse.publicId,
        name: fileName,
        size: fileSize,
        type: fileType,
        extension: fileExtension,
      };
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      file: fileData,
    });

    await newMessage.save();

    // Populate sender info before sending via socket
    await newMessage.populate("senderId", "fullName profilePic");

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
        senderId: { $ne: userId },
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

export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const count = await Message.countDocuments({
      senderId: userId,
      receiverId: currentUserId,
      "readBy.user": { $ne: currentUserId },
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error("Error in getUnreadCount:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};