import { Server, Socket } from "socket.io";

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

    // Handle typing indicator
    socket.on("typing", (data: { conversationId: string; userId: string; userName: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit("userTyping", data);
    });

    // Handle stop typing
    socket.on("stopTyping", (data: { conversationId: string; userId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit("userStoppedTyping", data);
    });

    // Handle message read acknowledgment
    socket.on("messageRead", (data: { conversationId: string; messageId: string; userId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit("messageRead", data);
    });

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

export const emitToConversation = (conversationId: string, event: string, data: unknown): void => {
  io?.to(`conversation:${conversationId}`).emit(event, data);
};

export const emitToUser = (userId: string, event: string, data: unknown): void => {
  io?.to(`user:${userId}`).emit(event, data);
};

export const emitToRoom = (room: string, event: string, data: unknown): void => {
  io?.to(room).emit(event, data);
};