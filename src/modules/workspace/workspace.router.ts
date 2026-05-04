import { Router } from "express";
import { WorkspaceController } from "./workspace.controller";
import { authMiddleware } from "../../middleware/auth";

const router = Router();
const workspaceController = new WorkspaceController();

router.use(authMiddleware);

router.post("/", workspaceController.createWorkspace);
router.get("/", workspaceController.getUserWorkspaces);
router.get("/:id", workspaceController.getWorkspaceDetails);
router.post("/:id/members", workspaceController.addMember);

export default router;
