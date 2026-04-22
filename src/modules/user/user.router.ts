import { Router } from "express";
import {
  getProfile,
  updateProfile,
  deleteProfile,
  getUsers,
} from "./user.controller";
import { authMiddleware } from "../../middleware/auth";

const router = Router();

router.get("/", authMiddleware, getUsers);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.delete("/profile", authMiddleware, deleteProfile);

export default router;
