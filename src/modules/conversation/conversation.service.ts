import { Types } from "mongoose";
import { Conversation, IConversation } from "../../models/Conversation";
import { Message, IMessage } from "../../models/Message";

export interface CreateConversationDto {
  participants: string[];
}

export interface SendMessageDto {
  conversationId: string;
  content: string;
}

export const conversationService = {
  async create(dto: CreateConversationDto, senderId: string): Promise<IConversation> {
    const participantIds = dto.participants.map((id) => new Types.ObjectId(id));

    // Check if conversation already exists between these participants
    const existingConversation = await Conversation.findOne({
      participants: { $all: participantIds, $size: participantIds.length },
    });

    if (existingConversation) {
      return existingConversation;
    }

    const conversation = await Conversation.create({
      participants: participantIds,
    });

    return conversation;
  },

  async getConversation(conversationId: string): Promise<IConversation | null> {
    return Conversation.findById(conversationId).populate("participants", "name email");
  },

  async getUserConversations(userId: string): Promise<IConversation[]> {
    return Conversation.find({ participants: userId })
      .populate("participants", "name email")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1, updatedAt: -1 });
  },

  async sendMessage(dto: SendMessageDto, senderId: string): Promise<IMessage> {
    const message = await Message.create({
      conversationId: new Types.ObjectId(dto.conversationId),
      sender: new Types.ObjectId(senderId),
      content: dto.content,
    });

    // Update conversation's lastMessage and lastMessageAt
    await Conversation.findByIdAndUpdate(dto.conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    });

    return message;
  },

  async getConversationMessages(
    conversationId: string,
    limit = 50,
    before?: string
  ): Promise<IMessage[]> {
    const query: Record<string, unknown> = { conversationId };

    if (before) {
      query.createdAt = { $lt: new Types.ObjectId(before) };
    }

    return Message.find(query)
      .populate("sender", "name email")
      .sort({ createdAt: -1 })
      .limit(limit);
  },

  async markMessagesAsRead(
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