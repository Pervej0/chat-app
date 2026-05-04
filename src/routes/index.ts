import { Router } from "express";
import authRouter from "../modules/auth/auth.router";
import userRouter from "../modules/user/user.router";
import workspaceRouter from "../modules/workspace/workspace.router";
import channelRouter from "../modules/channel/channel.router";
import taskRouter from "../modules/task/task.router";
import messageRouter from "../modules/message/message.router";

const router = Router();
const allRoutes = [
  { path: "/auth", route: authRouter },
  { path: "/users", route: userRouter },
  { path: "/workspaces", route: workspaceRouter },
  { path: "/channels", route: channelRouter },
  { path: "/tasks", route: taskRouter },
  { path: "/messages", route: messageRouter },
];

allRoutes.forEach((item) => router.use(item.path, item.route));

export default router;
