import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessage extends Document {
  channelId: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  parentMessageId?: Types.ObjectId;
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    channelId: {
      type: Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    parentMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    readBy: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ channelId: 1, createdAt: -1 });
messageSchema.index({ parentMessageId: 1 });

export const Message = mongoose.model<IMessage>("Message", messageSchema);