import { NextFunction, Response } from "express";
import { conversationService } from "./conversation.service";
import { AuthRequest, ApiResponse } from "../../types";
import { CustomError } from "../../middleware";

interface CreateConversationBody {
  participants: string[];
}

export const createConversation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.userId;
  const { participants } = req.body as CreateConversationBody;

  if (!userId) {
    next(new CustomError("Unauthorized", 401));
    return;
  }

  if (!participants) {
    next(new CustomError("At least one participant is required", 400));
    return;
  }

  // Add current user to participants if not already included
  const allParticipants = participants.includes(userId)
    ? participants
    : [...participants, userId];

  try {
    const conversation = await conversationService.create(
      { participants: allParticipants },
      userId,
    );

    const response: ApiResponse = {
      success: true,
      data: conversation,
      message: "Conversation created successfully",
      timestamp: new Date().toISOString(),
    };
    res.status(201).json(response);
  } catch (error) {
    console.error("❌ REAL ERROR:", error);
    next(new CustomError("Failed to create conversation", 500, error));
  }
};

export const getConversations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    next(new CustomError("Unauthorized", 401));
    return;
  }

  try {
    const conversations =
      await conversationService.getUserConversations(userId);

    const response: ApiResponse = {
      success: true,
      data: conversations,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error) {
    next(new CustomError("Failed to fetch conversations", 500, error));
  }
};

export const getConversation = async (
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

    const response: ApiResponse = {
      success: true,
      data: conversation,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error) {
    next(new CustomError("Failed to fetch conversation", 500, error));
  }
};
