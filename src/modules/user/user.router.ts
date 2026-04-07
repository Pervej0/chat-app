import { Router } from "express";
import { getProfile, updateProfile, deleteProfile } from "./user.controller";
import { authMiddleware } from "../../middleware/auth";

const router = Router();

router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.delete("/profile", authMiddleware, deleteProfile);

export default router;