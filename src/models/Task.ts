import mongoose, { Document, Schema, Types } from "mongoose";

export type TaskStatus = "todo" | "in-progress" | "in-review" | "done";

export interface ITask extends Document {
  workspaceId: Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  assigneeId?: Types.ObjectId;
  reporterId: Types.ObjectId;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "in-review", "done"],
      default: "todo",
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dueDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ workspaceId: 1 });
taskSchema.index({ assigneeId: 1 });
taskSchema.index({ status: 1 });

export const Task = mongoose.model<ITask>("Task", taskSchema);
