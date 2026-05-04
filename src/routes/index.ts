import { Router } from "express";
import authRouter from "../modules/auth/auth.router";
import userRouter from "../modules/user/user.router";
import conversationRouter from "../modules/conversation/conversation.router";
import messageRouter from "../modules/message/message.router";

const router = Router();
const allRoutes = [
  { path: "/auth", route: authRouter },
  { path: "/users", route: userRouter },
  { path: "/conversations", route: conversationRouter },
  { path: "/messages", route: messageRouter },
];

allRoutes.forEach((item) => router.use(item.path, item.route));

export default router;
