import { Router } from "express";
import {
  createConversation,
  getConversations,
  getConversation,
  sendMessage,
  getMessages,
  markAsRead,
  getUnreadCount,
} from "./conversation.controller";
import { authMiddleware } from "../../middleware/auth";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Conversation routes
router.post("/", createConversation);
router.get("/", getConversations);
router.get("/:conversationId", getConversation);

// Message routes
router.post("/:conversationId/messages", sendMessage);
router.get("/:conversationId/messages", getMessages);
router.put("/:conversationId/read", markAsRead);
router.get("/:conversationId/unread", getUnreadCount);

export default router;