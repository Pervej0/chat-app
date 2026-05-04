import { Server, Socket } from "socket.io";
import { messageService } from "../modules/message/message.service";

let io: Server | null = null;

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

    socket.onAny((event, ...args) => {
      console.log("🔥 EVENT RECEIVED:", event, args);
    });

    // Handle user authentication
    socket.on("authenticate", (userId: string) => {
      socket.data.userId = userId; // Store on socket for later use
      connectedUsers.set(userId, { userId, socketId: socket.id });
      socket.join(`user:${userId}`);
      console.log(`User ${userId} authenticated`, socket.data.userId);
    });

    // Handle joining a workspace room
    socket.on("joinWorkspace", (workspaceId: string) => {
      socket.join(`workspace:${workspaceId}`);
      console.log(`Socket ${socket.id} joined workspace ${workspaceId}`);
    });

    // Handle joining a channel room
    socket.on("joinChannel", (channelId: string) => {
      socket.join(`channel:${channelId}`);
      console.log(`Socket ${socket.id} joined channel ${channelId}`);
    });

    // Handle leaving a channel room
    socket.on("leaveChannel", (channelId: string) => {
      socket.leave(`channel:${channelId}`);
      console.log(`Socket ${socket.id} left channel ${channelId}`);
    });

    // Handle sending a message
    socket.on(
      "sendMessage",
      async (data: { channelId: string; content: string; parentMessageId?: string }) => {
        const userId = socket.data.userId;
        console.log("User ID::::::", userId);
        if (!userId) {
          console.error("Cannot send message: user not authenticated");
          return;
        }

        try {
          const message = await messageService.create(
            { channelId: data.channelId, content: data.content, parentMessageId: data.parentMessageId },
            userId,
          );

          // Populate sender info for the response
          const populatedMessage = await messageService.findById(
            message._id.toString(),
          );

          // Extract sender name from populated document
          const senderObj = populatedMessage?.sender as unknown as
            | { name: string }
            | undefined;
          const senderName = senderObj?.name || "";

          // Broadcast to all participants in the channel including sender
          emitToChannel(data.channelId, "newMessage", {
            id: message._id.toString(),
            channelId: message.channelId.toString(),
            senderId: message.sender.toString(),
            senderName,
            text: message.content,
            content: message.content,
            parentMessageId: message.parentMessageId?.toString(),
            createdAt: message.createdAt,
            status: "sent",
          });
        } catch (error) {
          console.error("Failed to send message via socket:", error);
        }
      },
    );

    // Handle typing indicator
    socket.on(
      "typing",
      (data: { channelId: string; userId: string; userName: string }) => {
        socket
          .to(`channel:${data.channelId}`)
          .emit("userTyping", data);
      },
    );

    // Handle stop typing
    socket.on(
      "stopTyping",
      (data: { channelId: string; userId: string }) => {
        socket
          .to(`channel:${data.channelId}`)
          .emit("userStoppedTyping", data);
      },
    );

    // Handle message read acknowledgment
    socket.on(
      "messageRead",
      (data: { channelId: string; messageId: string; userId: string }) => {
        socket
          .to(`channel:${data.channelId}`)
          .emit("messageRead", data);
      },
    );

    // Handle disconnection
    socket.on("disconnect", () => {
      for (const [userId, user] of connectedUsers.entries()) {
        if (user.socketId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`User ${userId} disconnected`);
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
