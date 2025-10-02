import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage,markMessagesAsRead,getUnreadCount} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.post("/mark-read", protectRoute, markMessagesAsRead);
router.get("/unread/:userId", protectRoute, getUnreadCount);
export default router;
