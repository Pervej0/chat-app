import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./core";
import routes from "./routes";
import { requestLogger, errorHandler } from "./middleware";

export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging
  if (config.nodeEnv !== "test") {
    console.log("Hello Start");
    app.use(requestLogger);
  }

  // Routes
  app.use("/api/v1", routes);

  // Error handling
  app.use(errorHandler);

  return app;
};
