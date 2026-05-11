import { Channel, IChannel, ChannelType, Workspace } from "../../models";
import { Types } from "mongoose";

export class ChannelService {
  async createChannel(
    workspaceId: string,
    name: string | undefined,
    type: ChannelType,
    memberIds: string[],
  ): Promise<IChannel> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    if (type !== "direct" && (!name || name.trim() === "")) {
      throw new Error("Public and private channels require a name");
    }

    if (type === "direct" && memberIds.length !== 2) {
      throw new Error("Direct messages must have exactly 2 members");
    }

    const members = memberIds.map((id) => new Types.ObjectId(id));

    const newChannel = await Channel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      name,
      type,
      members,
    });

    return newChannel;
  }

  async getChannelsForUserInWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<IChannel[]> {
    // A user can see public channels in the workspace + channels they are a member of
    return Channel.find({
      workspaceId: new Types.ObjectId(workspaceId),
      $or: [{ type: "public" }, { members: new Types.ObjectId(userId) }],
    }).populate({
      path: "members",
      select: "name email",
    });
  }

  async joinChannel(
    channelId: string,
    userId: string,
  ): Promise<IChannel | null> {
    const channel = await Channel.findById(channelId);
    if (!channel) throw new Error("Channel not found");

    if (channel.type === "direct") {
      throw new Error("Cannot join a direct message channel");
    }

    const memberExists = channel.members.find((m) => m.toString() === userId);
    if (memberExists) {
      throw new Error("User already in channel");
    }

    channel.members.push(new Types.ObjectId(userId));
    await channel.save();

    return channel;
  }

  async getOrCreateDirectChannel(
    workspaceId: string,
    user1Id: string,
    user2Id: string,
  ): Promise<IChannel> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    // Check if both users are in the workspace
    const member1 = workspace.members.find((m) => m.userId.toString() === user1Id);
    const member2 = workspace.members.find((m) => m.userId.toString() === user2Id);

    if (!member1 || !member2) {
      throw new Error("Both users must be members of the workspace");
    }

    // Check if direct channel already exists
    let channel = await Channel.findOne({
      workspaceId: new Types.ObjectId(workspaceId),
      type: "direct",
      members: { $all: [new Types.ObjectId(user1Id), new Types.ObjectId(user2Id)] },
    });

    if (!channel) {
      channel = await Channel.create({
        workspaceId: new Types.ObjectId(workspaceId),
        type: "direct",
        members: [new Types.ObjectId(user1Id), new Types.ObjectId(user2Id)],
      });
    }

    return channel.populate({
      path: "members",
      select: "name email",
    });
  }
}
