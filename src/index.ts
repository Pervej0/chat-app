import { createApp } from "./app";
import { config } from "./core";
import { connectDatabase, disconnectDatabase } from "./core/database";

const start = async (): Promise<void> => {
  await connectDatabase();

  const app = createApp();

  const server = app.listen(config.port, () => {
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
