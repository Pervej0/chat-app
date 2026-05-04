import mongoose, { Document, Schema, Types } from "mongoose";

export type ChannelType = "public" | "private" | "direct";

export interface IChannel extends Document {
  workspaceId: Types.ObjectId;
  name?: string; // Optional for DMs
  type: ChannelType;
  members: Types.ObjectId[];
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const channelSchema = new Schema<IChannel>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["public", "private", "direct"],
      default: "public",
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastMessageAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Validate DMs have exactly 2 members or that channel name exists for public/private
channelSchema.pre("validate", async function () {
  if (this.type === "direct") {
    if (this.members.length !== 2) {
      throw new Error("Direct messages must have exactly 2 members.");
    }
  } else {
    if (!this.name || this.name.trim() === "") {
      throw new Error("Public or private channels must have a name.");
    }
  }
});

channelSchema.index({ workspaceId: 1 });
channelSchema.index({ members: 1 });
channelSchema.index({ lastMessageAt: -1 });

export const Channel = mongoose.model<IChannel>("Channel", channelSchema);
