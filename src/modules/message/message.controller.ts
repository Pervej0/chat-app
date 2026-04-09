import { Response } from "express";
import { messageService } from "./message.service";
import { conversationService } from "../conversation/conversation.service";
import { emitToConversation } from "../../socket";
import { AuthRequest, ApiResponse } from "../../types";

interface CreateMessageBody {
  conversationId: string;
  content: string;
}

interface UpdateMessageBody {
  content: string;
}

interface GetMessagesQuery {
  limit?: string;
  before?: string;
  after?: string;
}

export const createMessage = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;
  const { conversationId, content } = req.body as CreateMessageBody;

  if (!userId) {
    const response: ApiResponse = {
      success: false,
      message: "Unauthorized",
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
    return;
  }

  if (!conversationId || !content) {
    const response: ApiResponse = {
      success: false,
      message: "Conversation ID and content are required",
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }

  try {
    const conversation =
      await conversationService.getConversation(conversationId);

    if (!conversation) {
      const response: ApiResponse = {
        success: false,
        message: "Conversation not found",
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(response);
      return;
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === userId,
    );

    if (!isParticipant) {
      const response: ApiResponse = {
        success: false,
        message: "Access denied",
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(response);
      return;
    }

    const message = await messageService.create(
      { conversationId, content },
      userId,
    );

    // Emit to conversation participants
    emitToConversation(conversationId, "newMessage", message);

    const response: ApiResponse = {
      success: true,
      data: message,
      message: "Message sent successfully",
      timestamp: new Date().toISOString(),
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: "Failed to send message",
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
};

export const getMessage = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;
  const messageId = req.params.messageId as string;

  if (!userId) {
    const response: ApiResponse = {
      success: false,
      message: "Unauthorized",
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
    return;
  }

  try {
    const message = await messageService.findById(messageId);

    if (!message) {
      const response: ApiResponse = {
        success: false,
        message: "Message not found",
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: message,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: "Failed to fetch message",
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
};

export const getMessages = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;
  const conversationId = req.params.conversationId as string;
  const { limit, before, after } = req.query as GetMessagesQuery;

  if (!userId) {
    const response: ApiResponse = {
      success: false,
      message: "Unauthorized",
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
    return;
  }

  try {
    const conversation =
      await conversationService.getConversation(conversationId);

    if (!conversation) {
      const response: ApiResponse = {
        success: false,
        message: "Conversation not found",
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(response);
      return;
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === userId,
    );

    if (!isParticipant) {
      const response: ApiResponse = {
        success: false,
        message: "Access denied",
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(response);
      return;
    }

    const messages = await messageService.findByConversation(conversationId, {
      limit: limit ? parseInt(limit, 10) : 50,
      before,
      after,
    });

    const response: ApiResponse = {
      success: true,
      data: messages,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: "Failed to fetch messages",
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
};

export const updateMessage = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;
  const messageId = req.params.messageId as string;
  const { content } = req.body as UpdateMessageBody;

  if (!userId) {
    const response: ApiResponse = {
      success: false,
      message: "Unauthorized",
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
    return;
  }

  if (!content) {
    const response: ApiResponse = {
      success: false,
      message: "Content is required",
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }

  try {
    const message = await messageService.update(messageId, { content }, userId);

    if (!message) {
      const response: ApiResponse = {
        success: false,
        message: "Message not found or unauthorized",
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(response);
      return;
    }

    emitToConversation(message.conversationId.toString(), "messageUpdated", message);

    const response: ApiResponse = {
      success: true,
      data: message,
      message: "Message updated successfully",
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: "Failed to update message",
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
};

export const deleteMessage = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;
  const messageId = req.params.messageId as string;

  if (!userId) {
    const response: ApiResponse = {
      success: false,
      message: "Unauthorized",
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
    return;
  }

  try {
    const message = await messageService.findById(messageId);
    const conversationId = message?.conversationId.toString();

    const deleted = await messageService.delete(messageId, userId);

    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        message: "Message not found or unauthorized",
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(response);
      return;
    }

    if (conversationId) {
      emitToConversation(conversationId, "messageDeleted", { messageId });
    }

    const response: ApiResponse = {
      success: true,
      message: "Message deleted successfully",
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: "Failed to delete message",
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
};

export const markAsRead = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;
  const conversationId = req.params.conversationId as string;

  if (!userId) {
    const response: ApiResponse = {
      success: false,
      message: "Unauthorized",
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
    return;
  }

  try {
    const conversation =
      await conversationService.getConversation(conversationId);

    if (!conversation) {
      const response: ApiResponse = {
        success: false,
        message: "Conversation not found",
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(response);
      return;
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === userId,
    );

    if (!isParticipant) {
      const response: ApiResponse = {
        success: false,
        message: "Access denied",
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(response);
      return;
    }

    const result = await messageService.markConversationAsRead(
      conversationId,
      userId,
    );

    emitToConversation(conversationId, "messagesRead", { userId, ...result });

    const response: ApiResponse = {
      success: true,
      data: result,
      message: "Messages marked as read",
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: "Failed to mark messages as read",
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
};

export const getUnreadCount = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;
  const conversationId = req.params.conversationId as string;

  if (!userId) {
    const response: ApiResponse = {
      success: false,
      message: "Unauthorized",
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
    return;
  }

  try {
    const conversation =
      await conversationService.getConversation(conversationId);

    if (!conversation) {
      const response: ApiResponse = {
        success: false,
        message: "Conversation not found",
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(response);
      return;
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === userId,
    );

    if (!isParticipant) {
      const response: ApiResponse = {
        success: false,
        message: "Access denied",
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(response);
      return;
    }

    const count = await messageService.getUnreadCount(conversationId, userId);

    const response: ApiResponse = {
      success: true,
      data: { unreadCount: count },
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: "Failed to get unread count",
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
};
