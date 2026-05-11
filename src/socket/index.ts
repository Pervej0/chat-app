import { Server, Socket } from "socket.io";
import { messageService } from "../modules/message/message.service";
import { ChannelService } from "../modules/channel/channel.service";
import { Channel } from "../models";

let io: Server | null = null;
const channelService = new ChannelService();

export interface SocketUser {
  userId: string;
  socketId: string;
}

// Store connected users
const connectedUsers: Map<string, SocketUser> = new Map();

export const initializeSocket = (server: Server): void => {
  io = server;

  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    // Handle user authentication
    socket.on("authenticate", (userId: string) => {
      socket.data.userId = userId;
      connectedUsers.set(userId, { userId, socketId: socket.id });
      socket.join(`user:${userId}`);
      console.log(`User ${userId} authenticated`);
    });

    // Handle joining a workspace room
    socket.on("joinWorkspace", (workspaceId: string) => {
      socket.join(`workspace:${workspaceId}`);
      console.log(`Socket ${socket.id} joined workspace ${workspaceId}`);
    });

    // Handle joining a channel room
    socket.on("joinChannel", async (channelId: string) => {
      const userId = socket.data.userId;
      if (!userId) return;

      try {
        // Verify membership before joining
        const channel = await Channel.findById(channelId);
        if (!channel || !channel.members.some(m => m.toString() === userId)) {
          console.warn(`User ${userId} attempted to join unauthorized channel ${channelId}`);
          return;
        }

        socket.join(`channel:${channelId}`);
        console.log(`Socket ${socket.id} joined channel ${channelId}`);
      } catch (error) {
        console.error("Error joining channel room:", error);
      }
    });

    // Handle leaving a channel room
    socket.on("leaveChannel", (channelId: string) => {
      socket.leave(`channel:${channelId}`);
      console.log(`Socket ${socket.id} left channel ${channelId}`);
    });

    // Handle sending a message (Generic for Channels and existing DMs)
    socket.on(
      "sendMessage",
      async (data: { channelId: string; content: string; parentMessageId?: string }) => {
        const userId = socket.data.userId;
        if (!userId) {
          console.error("Cannot send message: user not authenticated");
          return;
        }

        try {
          // 1. Verify membership
          const channel = await Channel.findById(data.channelId);
          if (!channel || !channel.members.some(m => m.toString() === userId)) {
            console.error("Unauthorized: User not in channel");
            return;
          }

          // 2. Save message
          const message = await messageService.create(
            { channelId: data.channelId, content: data.content, parentMessageId: data.parentMessageId },
            userId,
          );

          // 3. Populate and Prepare Response
          const populatedMessage = await messageService.findById(message._id.toString());
          const senderObj = populatedMessage?.sender as any;
          const senderName = senderObj?.name || "Unknown";

          const messageData = {
            id: message._id.toString(),
            channelId: message.channelId.toString(),
            senderId: message.sender.toString(),
            senderName,
            text: message.content,
            content: message.content,
            parentMessageId: message.parentMessageId?.toString(),
            createdAt: message.createdAt,
            status: "sent",
          };

          // 4. Broadcast to active channel room
          emitToChannel(data.channelId, "newMessage", messageData);

          // 5. Notify all members individually (for notifications/unread counts)
          channel.members.forEach(memberId => {
            if (memberId.toString() !== userId) {
              emitToUser(memberId.toString(), "newNotification", {
                type: "message",
                channelId: data.channelId,
                message: messageData
              });
            }
          });

        } catch (error) {
          console.error("Failed to send message via socket:", error);
        }
      },
    );

    // Handle initiating/sending a Direct Message (using target userId)
    socket.on(
      "sendDirectMessage",
      async (data: { workspaceId: string; recipientId: string; content: string }) => {
        const userId = socket.data.userId;
        if (!userId) return;

        try {
          // 1. Get or create the DM channel
          const channel = await channelService.getOrCreateDirectChannel(
            data.workspaceId,
            userId,
            data.recipientId
          );

          // 2. Reuse sendMessage logic or call it directly
          const message = await messageService.create(
            { channelId: channel._id.toString(), content: data.content },
            userId
          );

          const populatedMessage = await messageService.findById(message._id.toString());
          const senderObj = populatedMessage?.sender as any;

          const messageData = {
            id: message._id.toString(),
            channelId: channel._id.toString(),
            senderId: message.sender.toString(),
            senderName: senderObj?.name || "Unknown",
            content: message.content,
            createdAt: message.createdAt,
          };

          // 3. Emit to both users (using their personal rooms)
          emitToUser(userId, "newMessage", messageData);
          emitToUser(data.recipientId, "newMessage", messageData);
          
          // Also emit a specific event for first-time DM initialization
          emitToUser(data.recipientId, "newDirectChannel", channel);

        } catch (error) {
          console.error("Failed to send direct message:", error);
        }
      }
    );

    // Handle typing indicators
    socket.on("typing", (data: { channelId: string; userId: string; userName: string }) => {
      socket.to(`channel:${data.channelId}`).emit("userTyping", data);
    });

    socket.on("stopTyping", (data: { channelId: string; userId: string }) => {
      socket.to(`channel:${data.channelId}`).emit("userStoppedTyping", data);
    });

    // Handle message read acknowledgment
    socket.on(
      "messageRead",
      async (data: { channelId: string; messageId: string; userId: string }) => {
        const userId = socket.data.userId;
        if (!userId || userId !== data.userId) return;

        try {
          // Verify membership
          const channel = await Channel.findById(data.channelId);
          if (!channel || !channel.members.some(m => m.toString() === userId)) {
            return;
          }

          // Mark as read in DB
          await messageService.markAsRead(data.messageId, userId);

          // Notify others in the channel room
          socket.to(`channel:${data.channelId}`).emit("messageRead", data);
        } catch (error) {
          console.error("Error handling messageRead:", error);
        }
      },
    );

    // Handle disconnection
    socket.on("disconnect", () => {
      for (const [userId, user] of connectedUsers.entries()) {
        if (user.socketId === socket.id) {
          connectedUsers.delete(userId);
          break;
        }
      }
    });
  });
};


export const getIO = (): Server | null => io;

export const getConnectedUsers = (): Map<string, SocketUser> => connectedUsers;

export const emitToChannel = (
  channelId: string,
  event: string,
  data: unknown,
): void => {
  io?.to(`channel:${channelId}`).emit(event, data);
};

export const emitToWorkspace = (
  workspaceId: string,
  event: string,
  data: unknown,
): void => {
  io?.to(`workspace:${workspaceId}`).emit(event, data);
};

export const emitToUser = (
  userId: string,
  event: string,
  data: unknown,
): void => {
  io?.to(`user:${userId}`).emit(event, data);
};

export const emitToRoom = (
  room: string,
  event: string,
  data: unknown,
): void => {
  io?.to(room).emit(event, data);
};
