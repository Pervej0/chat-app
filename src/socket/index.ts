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

    // Handle user authentication
    socket.on("authenticate", (userId: string) => {
      socket.data.userId = userId; // Store on socket for later use
      connectedUsers.set(userId, { userId, socketId: socket.id });
      socket.join(`user:${userId}`);
      console.log(`User ${userId} authenticated`);
    });

    // Handle joining a conversation room
    socket.on("joinConversation", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Handle leaving a conversation room
    socket.on("leaveConversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} left conversation ${conversationId}`);
    });

    // Handle sending a message
    socket.on(
      "sendMessage",
      async (data: { conversationId: string; text: string }) => {
        const userId = socket.data.userId;
        if (!userId) {
          console.error("Cannot send message: user not authenticated");
          return;
        }

        try {
          const message = await messageService.create(
            { conversationId: data.conversationId, content: data.text },
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

          // Broadcast to all participants in the conversation including sender
          emitToConversation(data.conversationId, "newMessage", {
            id: message._id.toString(),
            conversationId: message.conversationId.toString(),
            senderId: message.sender.toString(),
            senderName,
            text: message.content,
            content: message.content,
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
      (data: { conversationId: string; userId: string; userName: string }) => {
        socket
          .to(`conversation:${data.conversationId}`)
          .emit("userTyping", data);
      },
    );

    // Handle stop typing
    socket.on(
      "stopTyping",
      (data: { conversationId: string; userId: string }) => {
        socket
          .to(`conversation:${data.conversationId}`)
          .emit("userStoppedTyping", data);
      },
    );

    // Handle message read acknowledgment
    socket.on(
      "messageRead",
      (data: { conversationId: string; messageId: string; userId: string }) => {
        socket
          .to(`conversation:${data.conversationId}`)
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

export const emitToConversation = (
  conversationId: string,
  event: string,
  data: unknown,
): void => {
  io?.to(`conversation:${conversationId}`).emit(event, data);
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
