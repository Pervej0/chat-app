import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types";
import { WorkspaceService } from "./workspace.service";

const workspaceService = new WorkspaceService();

export class WorkspaceController {
  async createWorkspace(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, slug } = req.body;
      const ownerId = req.user?.userId; // Assuming auth middleware sets req.user

      if (!ownerId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!name || !slug) {
        res.status(400).json({ message: "Name and slug are required" });
        return;
      }

      const workspace = await workspaceService.createWorkspace(name, slug, ownerId);
      res.status(201).json({ success: true, data: workspace });
    } catch (error) {
      next(error);
    }
  }

  async getUserWorkspaces(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const workspaces = await workspaceService.getWorkspacesForUser(userId);
      res.status(200).json({ success: true, data: workspaces });
    } catch (error) {
      next(error);
    }
  }

  async getWorkspaceDetails(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const workspace = await workspaceService.getWorkspaceById(id);
      
      if (!workspace) {
        res.status(404).json({ message: "Workspace not found" });
        return;
      }

      res.status(200).json({ success: true, data: workspace });
    } catch (error) {
      next(error);
    }
  }

  async addMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { userId, role } = req.body;

      if (!userId) {
        res.status(400).json({ message: "User ID is required" });
        return;
      }

      const workspace = await workspaceService.addMember(id, userId, role);
      res.status(200).json({ success: true, data: workspace });
    } catch (error) {
      next(error);
    }
  }
}
