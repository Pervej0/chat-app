import { Response } from "express";
import { AuthRequest } from "../../types";
import { ChannelService } from "./channel.service";
import { asyncHandler } from "../../middleware/errorHandler";
import { UnauthorizedError } from "../../utils/errors";

const channelService = new ChannelService();

export class ChannelController {
  createChannel = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { workspaceId, name, type, members } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new UnauthorizedError();
    }

    // Ensure creator is in the members list
    const memberIds = Array.isArray(members) ? members : [];
    if (!memberIds.includes(userId)) {
      memberIds.push(userId);
    }

    const channel = await channelService.createChannel(
      workspaceId,
      name,
      type,
      memberIds
    );

    res.status(201).json({ success: true, data: channel });
  });

  getChannels = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const workspaceId = req.params.workspaceId as string;
    const userId = req.user?.userId;

    if (!userId) {
      throw new UnauthorizedError();
    }

    const channels = await channelService.getChannelsForUserInWorkspace(workspaceId, userId);
    res.status(200).json({ success: true, data: channels });
  });

  joinChannel = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const id = req.params.id as string; // channelId
    const userId = req.user?.userId;

    if (!userId) {
      throw new UnauthorizedError();
    }

    const channel = await channelService.joinChannel(id, userId);
    res.status(200).json({ success: true, data: channel });
  });
}
