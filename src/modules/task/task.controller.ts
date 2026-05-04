import { Response } from "express";
import { AuthRequest } from "../../types";
import { TaskService } from "./task.service";
import { asyncHandler } from "../../middleware/errorHandler";
import { NotFoundError, UnauthorizedError } from "../../utils/errors";

const taskService = new TaskService();

export class TaskController {
  createTask = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { workspaceId, title, description, assigneeId, dueDate } = req.body;
    const reporterId = req.user?.userId;

    if (!reporterId) {
      throw new UnauthorizedError();
    }

    const task = await taskService.createTask(
      workspaceId,
      title,
      description,
      reporterId,
      assigneeId,
      dueDate ? new Date(dueDate) : undefined
    );

    res.status(201).json({ success: true, data: task });
  });

  getTasks = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const workspaceId = req.params.workspaceId as string;
    const { status, assigneeId } = req.query;

    const tasks = await taskService.getTasksForWorkspace(workspaceId, {
      status: status as any,
      assigneeId: assigneeId as string,
    });

    res.status(200).json({ success: true, data: tasks });
  });

  updateTask = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const updates = req.body;

    const task = await taskService.updateTask(id, updates);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    res.status(200).json({ success: true, data: task });
  });

  deleteTask = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const success = await taskService.deleteTask(id);
    
    if (!success) {
      throw new NotFoundError("Task not found");
    }

    res.status(200).json({ success: true, message: "Task deleted successfully" });
  });
}
