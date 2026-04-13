import { Router } from "express";
import {
  createConversation,
  getConversations,
  getConversation,
} from "./conversation.controller";
import { authMiddleware } from "../../middleware/auth";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Conversation routes
router.post("/", createConversation);
router.get("/", getConversations);
router.get("/:conversationId", getConversation);

export default router;