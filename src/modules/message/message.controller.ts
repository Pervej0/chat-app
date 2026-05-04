import { Response, NextFunction } from "express";
import { messageService } from "./message.service";
import { Channel } from "../../models";
import { emitToChannel } from "../../socket";
import { AuthRequest, ApiResponse } from "../../types";
import { CustomError } from "../../middleware";

interface CreateMessageBody {
  channelId: string;
  content: string;
  parentMessageId?: string;
}

interface UpdateMessageBody {
  content: string;
}

interface GetMessagesQuery {
  limit?: string;
  before?: string;
  after?: string;
  parentMessageId?: string;
}

export const createMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.userId;
  const { channelId, content, parentMessageId } = req.body as CreateMessageBody;

  if (!userId) {
    next(new CustomError("Unauthorized", 401));
    return;
  }

  if (!channelId || !content) {
    next(new CustomError("Channel ID and content are required", 400));
    return;
  }

  try {
    const channel = await Channel.findById(channelId);
    if (!channel) {
      next(new CustomError("Channel not found", 404));
      return;
    }

    const isParticipant = channel.type === "public" || channel.members.some(
      (m) => m.toString() === userId,
    );

    if (!isParticipant) {
      next(new CustomError("Access denied", 403));
      return;
    }

    const message = await messageService.create(
      { channelId, content, parentMessageId },
      userId,
    );

    const populatedMessage = await messageService.findById(
      message._id.toString(),
    );

    emitToChannel(channelId, "newMessage", populatedMessage);

    const response: ApiResponse = {
      success: true,
      data: populatedMessage,
      message: "Message sent successfully",
      timestamp: new Date().toISOString(),
    };
    res.status(201).json(response);
  } catch (error) {
    next(new CustomError("Failed to send message", 500, error));
  }
};

export const getMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.userId;
  const channelId = req.params.channelId as string;
  const { limit, before, after, parentMessageId } = req.query as GetMessagesQuery;

  if (!userId) {
    next(new CustomError("Unauthorized", 401));
    return;
  }

  try {
    const channel = await Channel.findById(channelId);

    if (!channel) {
      next(new CustomError("Channel not found", 404));
      return;
    }

    const isParticipant = channel.type === "public" || channel.members.some(
      (m) => m.toString() === userId,
    );

    if (!isParticipant) {
      next(new CustomError("Access denied", 403));
      return;
    }

    const messages = await messageService.findByChannel(channelId, {
      limit: limit ? parseInt(limit, 10) : 50,
      before,
      after,
      parentMessageId,
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

// ... other methods can be adapted similarly ...
