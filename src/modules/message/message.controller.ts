import { Response, NextFunction } from "express";
import { messageService } from "./message.service";
import { conversationService } from "../conversation/conversation.service";
import { emitToConversation } from "../../socket";
import { AuthRequest, ApiResponse } from "../../types";
import { CustomError } from "../../middleware";

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
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.userId;
  const { conversationId, content } = req.body as CreateMessageBody;

  if (!userId) {
    next(new CustomError("Unauthorized", 401));
    return;
  }

  if (!conversationId || !content) {
    next(new CustomError("Conversation ID and content are required", 400));
    return;
  }

  try {
    const conversation =
      await conversationService.getConversation(conversationId);
    if (!conversation) {
      next(new CustomError("Conversation not found", 404));
      return;
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === userId,
    );

    if (!isParticipant) {
      next(new CustomError("Access denied", 403));
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
    next(new CustomError("Failed to send message", 500, error));
  }
};

export const getMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.userId;
  const messageId = req.params.messageId as string;

  if (!userId) {
    next(new CustomError("Unauthorized", 401));
    return;
  }

  try {
    const message = await messageService.findById(messageId);

    if (!message) {
      next(new CustomError("Message not found", 404));
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: message,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error) {
    next(new CustomError("Failed to fetch message", 500, error));
  }
};

export const getMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.userId;
  const conversationId = req.params.conversationId as string;
  const { limit, before, after } = req.query as GetMessagesQuery;

  if (!userId) {
    next(new CustomError("Unauthorized", 401));
    return;
  }

  try {
    const conversation =
      await conversationService.getConversation(conversationId);

    if (!conversation) {
      next(new CustomError("Conversation not found", 404));
      return;
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === userId,
    );

    if (!isParticipant) {
      next(new CustomError("Access denied", 403));
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
    next(new CustomError("Failed to fetch messages", 500, error));
  }
};

export const updateMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.userId;
  const messageId = req.params.messageId as string;
  const { content } = req.body as UpdateMessageBody;

  if (!userId) {
    next(new CustomError("Unauthorized", 401));
    return;
  }

  if (!content) {
    next(new CustomError("Content is required", 400));
    return;
  }

  try {
    const message = await messageService.update(messageId, { content }, userId);

    if (!message) {
      next(new CustomError("Message not found or unauthorized", 404));
      return;
    }

    emitToConversation(
      message.conversationId.toString(),
      "messageUpdated",
      message,
    );

    const response: ApiResponse = {
      success: true,
      data: message,
      message: "Message updated successfully",
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error) {
    next(new CustomError("Failed to update message", 500, error));
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
