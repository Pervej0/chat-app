import { Router } from "express";
import { register, login, refresh, logout, forgotPassword, resetPassword } from "./auth.controller";
import { validateResource } from "../../middleware/validateResource";
import { registerSchema, loginSchema } from "../../schemas/auth.schema";

const router = Router();

router.post("/register", validateResource(registerSchema), register);
router.post("/login", validateResource(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;