import { Response } from "express";
import { AuthRequest } from "../../types";
import { WorkspaceService } from "./workspace.service";
import { asyncHandler } from "../../middleware/errorHandler";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../utils/errors";

const workspaceService = new WorkspaceService();

export class WorkspaceController {
  createWorkspace = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, slug } = req.body;
    const ownerId = req.user?.userId;

    if (!ownerId) {
      throw new UnauthorizedError();
    }

    if (!name || !slug) {
      throw new BadRequestError("Name and slug are required");
    }

    const workspace = await workspaceService.createWorkspace(name, slug, ownerId);
    res.status(201).json({ success: true, data: workspace });
  });

  getUserWorkspaces = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError();
    }

    const workspaces = await workspaceService.getWorkspacesForUser(userId);
    res.status(200).json({ success: true, data: workspaces });
  });

  getWorkspaceDetails = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const workspace = await workspaceService.getWorkspaceById(id);
    
    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    res.status(200).json({ success: true, data: workspace });
  });

  addMember = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { userId, role } = req.body;

    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    const workspace = await workspaceService.addMember(id, userId, role);
    res.status(200).json({ success: true, data: workspace });
  });
}
