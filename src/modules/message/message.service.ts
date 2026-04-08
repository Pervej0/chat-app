import { Types } from "mongoose";
import { Message, IMessage } from "../../models/Message";

export interface CreateMessageDto {
  conversationId: string;
  content: string;
}

export interface UpdateMessageDto {
  content?: string;
}

export const messageService = {
  async create(dto: CreateMessageDto, senderId: string): Promise<IMessage> {
    const message = await Message.create({
      conversationId: new Types.ObjectId(dto.conversationId),
      sender: new Types.ObjectId(senderId),
      content: dto.content,
    });
    return message;
  },

  async findById(id: string): Promise<IMessage | null> {
    return Message.findById(id).populate("sender", "name email");
  },

  async findByConversation(
    conversationId: string,
    options?: { limit?: number; before?: string; after?: string }
  ): Promise<IMessage[]> {
    const query: Record<string, unknown> = {
      conversationId: new Types.ObjectId(conversationId),
    };

    if (options?.before) {
      query.createdAt = { $lt: new Date(options.before) };
    }

    if (options?.after) {
      query.createdAt = { $gt: new Date(options.after) };
    }

    return Message.find(query)
      .populate("sender", "name email")
      .sort({ createdAt: -1 })
      .limit(options?.limit || 50);
  },

  async update(
    id: string,
    dto: UpdateMessageDto,
    userId: string
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
    userId: string
  ): Promise<IMessage | null> {
    return Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { readBy: new Types.ObjectId(userId) } },
      { new: true }
    );
  },

  async markConversationAsRead(
    conversationId: string,
    userId: string
  ): Promise<{ modifiedCount: number }> {
    const result = await Message.updateMany(
      {
        conversationId: new Types.ObjectId(conversationId),
        readBy: { $ne: new Types.ObjectId(userId) },
        sender: { $ne: new Types.ObjectId(userId) },
      },
      {
        $addToSet: { readBy: new Types.ObjectId(userId) },
      }
    );

    return { modifiedCount: result.modifiedCount };
  },

  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    return Message.countDocuments({
      conversationId: new Types.ObjectId(conversationId),
      readBy: { $ne: new Types.ObjectId(userId) },
      sender: { $ne: new Types.ObjectId(userId) },
    });
  },
};