import { Types } from "mongoose";
import { Message, IMessage, Channel } from "../../models";

export interface CreateMessageDto {
  channelId: string;
  content: string;
  parentMessageId?: string;
}

export interface UpdateMessageDto {
  content?: string;
}

export const messageService = {
  async create(dto: CreateMessageDto, senderId: string): Promise<IMessage> {
    const message = await Message.create({
      channelId: new Types.ObjectId(dto.channelId),
      sender: new Types.ObjectId(senderId),
      content: dto.content,
      parentMessageId: dto.parentMessageId ? new Types.ObjectId(dto.parentMessageId) : undefined,
    });

    // Update channel's lastMessageAt
    await Channel.findByIdAndUpdate(dto.channelId, {
      lastMessageAt: new Date(),
    });

    return message;
  },

  async findById(id: string): Promise<IMessage | null> {
    const message = await Message.findById(id).populate("sender", "name email");
    return message ? message.toObject() : null;
  },

  async findByChannel(
    channelId: string,
    options?: { limit?: number; before?: string; after?: string; parentMessageId?: string },
  ): Promise<IMessage[]> {
    const query: Record<string, unknown> = {
      channelId: new Types.ObjectId(channelId),
    };

    if (options?.parentMessageId) {
      query.parentMessageId = new Types.ObjectId(options.parentMessageId);
    } else {
      // Fetch only top-level messages if parentMessageId is not provided
      query.parentMessageId = { $exists: false };
    }

    if (options?.before) {
      query.createdAt = { $lt: new Date(options.before) };
    }

    if (options?.after) {
      query.createdAt = { $gt: new Date(options.after) };
    }

    const messages = await Message.find(query)
      .populate("sender", "name email")
      .sort({ createdAt: 1 })
      .limit(options?.limit || 50);

    return messages.map((m) => m.toObject());
  },

  async update(
    id: string,
    dto: UpdateMessageDto,
    userId: string,
  ): Promise<IMessage | null> {
    const message = await Message.findOne({
      _id: id,
      sender: new Types.ObjectId(userId),
    });

    if (!message) {
      return null;
    }

    if (dto.content) {
      message.content = dto.content;
      await message.save();
    }

    return message;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await Message.findOneAndDelete({
      _id: id,
      sender: new Types.ObjectId(userId),
    });
    return result !== null;
  },

  async markAsRead(
    messageId: string,
    userId: string,
  ): Promise<IMessage | null> {
    return Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { readBy: new Types.ObjectId(userId) } },
      { new: true },
    );
  },

  async markChannelAsRead(
    channelId: string,
    userId: string,
  ): Promise<{ modifiedCount: number }> {
    const result = await Message.updateMany(
      {
        channelId: new Types.ObjectId(channelId),
        readBy: { $ne: new Types.ObjectId(userId) },
        sender: { $ne: new Types.ObjectId(userId) },
      },
      {
        $addToSet: { readBy: new Types.ObjectId(userId) },
      },
    );

    return { modifiedCount: result.modifiedCount };
  },

  async getUnreadCount(
    channelId: string,
    userId: string,
  ): Promise<number> {
    return Message.countDocuments({
      channelId: new Types.ObjectId(channelId),
      readBy: { $ne: new Types.ObjectId(userId) },
      sender: { $ne: new Types.ObjectId(userId) },
    });
  },
};
