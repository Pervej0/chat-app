import http from "http";
import { Server } from "socket.io";

import { createApp } from "./app";
import { config } from "./core";
import { connectDatabase, disconnectDatabase } from "./core/database";
import { initializeSocket } from "./socket";

const start = async (): Promise<void> => {
  await connectDatabase();

  const app = createApp();

  // ✅ Create HTTP server
  const httpServer = http.createServer(app);

  // ✅ Attach Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // change to frontend URL later
    },
  });

  // ✅ Initialize your socket logic
  initializeSocket(io);

  // ✅ Start server
  const server = httpServer.listen(config.port, () => {
    console.log(
      `Server running in ${config.nodeEnv} mode on port ${config.port}`,
    );
  });

  const shutdown = async (): Promise<void> => {
    console.log("Shutting down gracefully...");
    server.close(async () => {
      await disconnectDatabase();
      console.log("Server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};

start();
