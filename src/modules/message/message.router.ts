import { Router } from "express";
import {
  createMessage,
  getMessage,
  getMessages,
  updateMessage,
  deleteMessage,
  markAsRead,
  getUnreadCount,
} from "./message.controller";
import { authMiddleware } from "../../middleware/auth";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Message routes
router.post("/", createMessage);
router.get("/:messageId", getMessage);
router.get("/conversation/:conversationId", getMessages);
router.put("/:messageId", updateMessage);
router.delete("/:messageId", deleteMessage);

// Read status routes
router.put("/conversation/:conversationId/read", markAsRead);
router.get("/conversation/:conversationId/unread", getUnreadCount);

export default router;