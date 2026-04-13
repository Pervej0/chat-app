import { Types } from "mongoose";
import { Conversation, IConversation } from "../../models/Conversation";

export interface CreateConversationDto {
  participants: string[];
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
};