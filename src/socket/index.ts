import { Server } from "socket.io";

let io: Server | null = null;

export interface SocketUser {
  userId: string;
  socketId: string;
}

// Store connected users
const connectedUsers: Map<string, SocketUser> = new Map();

export const initializeSocket = (server: Server): void => {
  io = server;

  io.on("connection", (socket: any) => {
    console.log("Client connected:", socket.id);

    // Handle user authentication
    socket.on("authenticate", (userId: string) => {
      // TODO: Validate user token
      // TODO: Associate socket with userId
      // TODO: Join user to their conversation rooms

      connectedUsers.set(userId, { userId, socketId: socket.id });
      socket.join(`user:${userId}`);
      console.log(`User ${userId} authenticated`);
    });

    // Handle joining a conversation room
    socket.on("joinConversation", (conversationId: string) => {
      // TODO: Validate user is participant
      // TODO: Check if user has access to conversation
      socket.join(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Handle leaving a conversation room
    socket.on("leaveConversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} left conversation ${conversationId}`);
    });

    // Handle typing indicator
    socket.on("typing", (data: { conversationId: string; userId: string }) => {
      // TODO: Emit typing event to conversation participants
      // socket.to(`conversation:${data.conversationId}`).emit("userTyping", data);
    });

    // Handle stop typing
    socket.on(
      "stopTyping",
      (data: { conversationId: string; userId: string }) => {
        // TODO: Emit stop typing event
      },
    );

    // Handle message read acknowledgment
    socket.on(
      "messageRead",
      (data: { conversationId: string; messageId: string; userId: string }) => {
        // TODO: Emit read receipt to sender
      },
    );

    // Handle disconnection
    socket.on("disconnect", () => {
      // Remove user from connected users
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

// Helper functions - to be implemented when socket connection is set up
export const emitToConversation = (
  conversationId: string,
  event: string,
  data: unknown,
): void => {
  // TODO: Implement - emit event to all sockets in conversation room
  // io?.to(`conversation:${conversationId}`).emit(event, data);
};

export const emitToUser = (
  userId: string,
  event: string,
  data: unknown,
): void => {
  // TODO: Implement - emit event to specific user
  // io?.to(`user:${userId}`).emit(event, data);
};

export const emitToRoom = (
  room: string,
  event: string,
  data: unknown,
): void => {
  // TODO: Implement - emit event to specific room
  // io?.to(room).emit(event, data);
};
