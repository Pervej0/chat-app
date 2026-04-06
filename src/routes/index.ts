import { Router } from "express";
import healthRouter from "../modules/health/health.router";
import authRouter from "../modules/auth/auth.router";

const router = Router();

const allRoutes = [
  { path: "/health", route: healthRouter },
  { path: "/users", route: authRouter },
];

allRoutes.forEach((item) => router.use(item.path, item.route));

export default router;
