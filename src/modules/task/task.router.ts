import { Router } from "express";
import { TaskController } from "./task.controller";
import { authMiddleware } from "../../middleware/auth";

const router = Router();
const taskController = new TaskController();

router.use(authMiddleware);

router.post("/", taskController.createTask);
router.get("/workspace/:workspaceId", taskController.getTasks);
router.patch("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

export default router;
