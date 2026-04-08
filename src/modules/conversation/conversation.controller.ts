import { Response } from "express";
import { conversationService } from "./conversation.service";
import { AuthRequest, ApiResponse } from "../../types";

interface CreateConversationBody {
  participants: string[];
}

interface SendMessageBody {
  conversationId: string;
  content: string;
}

interface GetMessagesQuery {
  limit?: string;
  before?: string;
}

export const createConversation = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.userId;
  const { participants } = req.body as CreateConversationBody;

  if (!userId) {
    const response: ApiResponse = {
      success: false,
      message: "Unauthorized",
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
    return;
  }

  if (!participants || !Array.isArray(participants) || participants.length < 1) {
    const response: ApiResponse = {
      success: false,
      message: "At least one participant is required",
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }

  // Add current user to participants if not already included
  const allParticipants = participants.includes(userId)
    ? participants
    : [...participants, userId];

  try {
    const conversation = await conversationService.create(
      { participants: allParticipants },
      userId
    );

    const response: ApiResponse = {
      success: true,
      data: conversation,
      message: "Conversation created successfully",
      timestamp: new Date().toISOString(),
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: "Failed to create conversation",
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
};

export const getConversations = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.userId;

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
    const conversations = await conversationService.getUserConversations(userId);

    const response: ApiResponse = {
      success: true,
      data: conversations,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: "Failed to fetch conversations",
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
};

export const getConversation = async (
  req: AuthRequest,
  res: Response
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
    const conversation = await conversationService.getConversation(conversationId);

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
      (p) => p._id.toString() === userId
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

    const response: ApiResponse = {
      success: true,
      data: conversation,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: "Failed to fetch conversation",
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
};

export const sendMessage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.userId;
  const conversationId = req.params.conversationId as string;
  const { content } = req.body as { content: string };

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
    const conversation = await conversationService.getConversation(conversationId);

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
      (p) => p._id.toString() === userId
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

    const message = await conversationService.sendMessage(
      { conversationId, content },
      userId
    );

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

export const getMessages = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.userId;
  const conversationId = req.params.conversationId as string;
  const { limit, before } = req.query as GetMessagesQuery;

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
    const conversation = await conversationService.getConversation(conversationId);

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
      (p) => p._id.toString() === userId
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

    const messages = await conversationService.getConversationMessages(
      conversationId,
      limit ? parseInt(limit, 10) : 50,
      before
    );

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

export const markAsRead = async (
  req: AuthRequest,
  res: Response
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
    const conversation = await conversationService.getConversation(conversationId);

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
      (p) => p._id.toString() === userId
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

    const result = await conversationService.markMessagesAsRead(
      conversationId,
      userId
    );

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
  res: Response
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
    const conversation = await conversationService.getConversation(conversationId);

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
      (p) => p._id.toString() === userId
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

    const count = await conversationService.getUnreadCount(conversationId, userId);

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