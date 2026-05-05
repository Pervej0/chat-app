import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./core";
import routes from "./routes";
import { requestLogger, errorHandler } from "./middleware";
import cookieParser from "cookie-parser";

export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());
  // const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];

  // app.use(
  //   cors({
  //     origin: (origin, callback) => {
  //       if (!origin || allowedOrigins.includes(origin)) {
  //         callback(null, true);
  //       } else {
  //         callback(new Error("Not allowed by CORS"));
  //       }
  //     },
  //     credentials: true,
  //   }),
  // );

  app.use(
    cors({
      origin: true, // reflect request origin (allows all)
      credentials: true,
    }),
  );

  // Body parsing
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));

  // Logging
  if (config.nodeEnv !== "test") {
    app.use(requestLogger);
  }

  // Routes
  app.use("/api/v1", routes);

  // Error handling
  app.use(errorHandler);

  return app;
};
