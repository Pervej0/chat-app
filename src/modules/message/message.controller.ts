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

    // Get populated message for response
    const populatedMessage = await messageService.findById(
      message._id.toString(),
    );
    const senderObj = populatedMessage?.sender as unknown as
      | { name: string }
      | undefined;
    const senderName = senderObj?.name || "";

    // Emit to conversation participants with formatted data
    emitToConversation(conversationId, "newMessage", {
      id: message._id.toString(),
      conversationId: message.conversationId.toString(),
      senderId: message.sender.toString(),
      senderName,
      text: message.content,
      content: message.content,
      createdAt: message.createdAt,
      status: "sent",
    });

    const response: ApiResponse = {
      success: true,
      data: {
        id: message._id.toString(),
        conversationId: message.conversationId.toString(),
        senderId: message.sender.toString(),
        senderName,
        text: message.content,
        content: message.content,
        createdAt: message.createdAt,
        status: "sent",
      },
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

    console.log(messages, "pppp");

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
    const conversationId = message?.conversationId.toString();

    const deleted = await messageService.delete(messageId, userId);

    if (!deleted) {
      next(new CustomError("Message not found or unauthorized", 404));
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
    next(new CustomError("Failed to delete message", 500, error));
  }
};

export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.userId;
  const conversationId = req.params.conversationId as string;

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
    next(new CustomError("Failed to mark messages as read", 500, error));
  }
};

export const getUnreadCount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.userId;
  const conversationId = req.params.conversationId as string;

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

    const count = await messageService.getUnreadCount(conversationId, userId);

    const response: ApiResponse = {
      success: true,
      data: { unreadCount: count },
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error) {
    next(new CustomError("Failed to get unread count", 500, error));
  }
};
