import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types";
import { TaskService } from "./task.service";

const taskService = new TaskService();

export class TaskController {
  async createTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workspaceId, title, description, assigneeId, dueDate } = req.body;
      const reporterId = req.user?.userId;

      if (!reporterId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
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
    } catch (error) {
      next(error);
    }
  }

  async getTasks(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const { status, assigneeId } = req.query;

      const tasks = await taskService.getTasksForWorkspace(workspaceId, {
        status: status as any,
        assigneeId: assigneeId as string,
      });

      res.status(200).json({ success: true, data: tasks });
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const updates = req.body;

      const task = await taskService.updateTask(id, updates);
      if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
      }

      res.status(200).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const success = await taskService.deleteTask(id);
      
      if (!success) {
        res.status(404).json({ message: "Task not found" });
        return;
      }

      res.status(200).json({ success: true, message: "Task deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
