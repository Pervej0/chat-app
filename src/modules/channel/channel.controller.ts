import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types";
import { ChannelService } from "./channel.service";

const channelService = new ChannelService();

export class ChannelController {
  async createChannel(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workspaceId, name, type, members } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
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
    } catch (error) {
      next(error);
    }
  }

  async getChannels(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const channels = await channelService.getChannelsForUserInWorkspace(workspaceId, userId);
      res.status(200).json({ success: true, data: channels });
    } catch (error) {
      next(error);
    }
  }

  async joinChannel(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string; // channelId
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const channel = await channelService.joinChannel(id, userId);
      res.status(200).json({ success: true, data: channel });
    } catch (error) {
      next(error);
    }
  }
}
