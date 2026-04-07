import { Router } from "express";
import healthRouter from "../modules/health/health.router";
import authRouter from "../modules/auth/auth.router";
import userRouter from "../modules/user/user.router";

const router = Router();

const allRoutes = [
  { path: "/health", route: healthRouter },
  { path: "/auth", route: authRouter },
  { path: "/users", route: userRouter },
];

allRoutes.forEach((item) => router.use(item.path, item.route));

export default router;
