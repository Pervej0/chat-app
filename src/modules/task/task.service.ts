import { Task, ITask, TaskStatus, Workspace } from "../../models";
import { Types } from "mongoose";

export class TaskService {
  async createTask(
    workspaceId: string,
    title: string,
    description: string | undefined,
    reporterId: string,
    assigneeId?: string,
    dueDate?: Date
  ): Promise<ITask> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    const newTask = await Task.create({
      workspaceId: new Types.ObjectId(workspaceId),
      title,
      description,
      status: "todo",
      reporterId: new Types.ObjectId(reporterId),
      assigneeId: assigneeId ? new Types.ObjectId(assigneeId) : undefined,
      dueDate,
    });

    return newTask;
  }

  async getTasksForWorkspace(
    workspaceId: string,
    filters?: { status?: TaskStatus; assigneeId?: string }
  ): Promise<ITask[]> {
    const query: any = { workspaceId: new Types.ObjectId(workspaceId) };

    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.assigneeId) {
      query.assigneeId = new Types.ObjectId(filters.assigneeId);
    }

    return Task.find(query).sort({ createdAt: -1 });
  }

  async updateTask(
    taskId: string,
    updates: Partial<Pick<ITask, "title" | "description" | "status" | "dueDate">> & { assigneeId?: string }
  ): Promise<ITask | null> {
    const updateData: any = { ...updates };
    
    if (updates.assigneeId !== undefined) {
      updateData.assigneeId = updates.assigneeId 
        ? new Types.ObjectId(updates.assigneeId) 
        : null; // Allows unassigning
    }

    const task = await Task.findByIdAndUpdate(taskId, updateData, {
      new: true,
      runValidators: true,
    });

    return task;
  }

  async deleteTask(taskId: string): Promise<boolean> {
    const result = await Task.findByIdAndDelete(taskId);
    return !!result;
  }
}
