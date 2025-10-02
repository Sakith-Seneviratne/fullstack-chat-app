import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroup,
  getUserGroups,
  getGroupMessages,
  sendGroupMessage,
  addGroupMembers,
  removeGroupMember,
  updateGroup,
  deleteGroup,
  getGroupUnreadCount, 

} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getUserGroups);
router.get("/:id/messages", protectRoute, getGroupMessages);
router.post("/:id/send", protectRoute, sendGroupMessage);
router.put("/:id/add-members", protectRoute, addGroupMembers);
router.put("/:id/remove-member", protectRoute, removeGroupMember);
router.put("/:id", protectRoute, updateGroup);
router.delete("/:id", protectRoute, deleteGroup);
router.get("/:groupId/unread", protectRoute, getGroupUnreadCount);


export default router;
