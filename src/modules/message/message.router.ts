import { Router } from "express";
import {
  createMessage,
  getMessages,
  sendDirectMessage,
} from "./message.controller";
import { authMiddleware } from "../../middleware/auth";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Message routes
router.post("/", createMessage);
router.post("/direct", sendDirectMessage);
router.get("/channel/:channelId", getMessages);

export default router;