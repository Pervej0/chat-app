import { Workspace, IWorkspace, IWorkspaceMember } from "../../models";
import { Types } from "mongoose";

export class WorkspaceService {
  async createWorkspace(
    name: string,
    slug: string,
    ownerId: string
  ): Promise<IWorkspace> {
    const existing = await Workspace.findOne({ slug });
    if (existing) {
      throw new Error("Workspace slug already exists");
    }

    const newWorkspace = await Workspace.create({
      name,
      slug,
      ownerId: new Types.ObjectId(ownerId),
      members: [{ userId: new Types.ObjectId(ownerId), role: "admin" }],
    });

    return newWorkspace;
  }

  async getWorkspacesForUser(userId: string): Promise<IWorkspace[]> {
    return Workspace.find({ "members.userId": new Types.ObjectId(userId) });
  }

  async getWorkspaceById(workspaceId: string): Promise<IWorkspace | null> {
    return Workspace.findById(workspaceId).populate("members.userId", "name email");
  }

  async addMember(
    workspaceId: string,
    userId: string,
    role: "admin" | "member" = "member"
  ): Promise<IWorkspace | null> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    const memberExists = workspace.members.find(
      (m) => m.userId.toString() === userId
    );
    if (memberExists) {
      throw new Error("User is already a member");
    }

    workspace.members.push({ userId: new Types.ObjectId(userId), role });
    await workspace.save();

    return this.getWorkspaceById(workspaceId);
  }
}
