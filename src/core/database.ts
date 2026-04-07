import mongoose from "mongoose";
import { config } from "./index";
import dotenv from "dotenv";

export const connectDatabase = async (): Promise<void> => {
  dotenv.config();
  try {
    const mongoUri = config.database.mongoUri;

    await mongoose.connect(mongoUri);

    console.log("MongoDB connected successfully");

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log("MongoDB disconnected");
};
