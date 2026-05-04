import { Response } from "express";
import { messageService } from "./message.service";
import { Channel } from "../../models";
import { emitToChannel } from "../../socket";
import { AuthRequest, ApiResponse } from "../../types";
import { asyncHandler } from "../../middleware/errorHandler";
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from "../../utils/errors";

interface CreateMessageBody {
  channelId: string;
  content: string;
  parentMessageId?: string;
}

interface GetMessagesQuery {
  limit?: string;
  before?: string;
  after?: string;
  parentMessageId?: string;
}

export const createMessage = asyncHandler(async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;
      console.log("DTO:::", req.body);

  const { channelId, content, parentMessageId } = req.body as CreateMessageBody;

  if (!userId) {
    throw new UnauthorizedError();
  }

  if (!channelId || !content) {
    throw new BadRequestError("Channel ID and content are required");
  }

  const channel = await Channel.findById(channelId);
  if (!channel) {
    throw new NotFoundError("Channel not found");
  }

  const isParticipant = channel.type === "public" || channel.members.some(
    (m) => m.toString() === userId,
  );

  if (!isParticipant) {
    throw new ForbiddenError("Access denied");
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
});

export const getMessages = asyncHandler(async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;
  const channelId = req.params.channelId as string;
  const { limit, before, after, parentMessageId } = req.query as GetMessagesQuery;

  if (!userId) {
    throw new UnauthorizedError();
  }

  const channel = await Channel.findById(channelId);

  if (!channel) {
    throw new NotFoundError("Channel not found");
  }

  const isParticipant = channel.type === "public" || channel.members.some(
    (m) => m.toString() === userId,
  );

  if (!isParticipant) {
    throw new ForbiddenError("Access denied");
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
});
