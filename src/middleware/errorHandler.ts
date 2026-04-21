import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ApiResponse } from "../types";

export interface AppError extends Error {
  statusCode?: number;
  code?: any;
}

// Custom error class
export class CustomError extends Error implements AppError {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Mongoose validation error
const handleMongooseValidationError = (
  err: mongoose.Error.ValidationError,
): string => {
  const errors = Object.values(err.errors).map((e) => e.message);
  return errors.join(", ");
};

// Mongoose duplicate key error
const handleMongooseDuplicateKeyError = (err: any): string => {
  const field = Object.keys(err.keyPattern || {})[0];
  return `${field || "Field"} already exists`;
};

// Mongoose cast error (invalid ObjectId)
const handleMongooseCastError = (err: mongoose.Error.CastError): string => {
  return `Invalid ${err.path}: ${err.value}`;
};

// Determine error type and get message
const getErrorInfo = (
  err: AppError,
): { statusCode: number; message: string } => {
  // Custom app errors
  if (err instanceof CustomError) {
    return { statusCode: err.statusCode, message: err.message };
  }

  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    return {
      statusCode: 400,
      message: handleMongooseValidationError(err),
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return {
      statusCode: 409,
      message: handleMongooseDuplicateKeyError(err as any),
    };
  }

  // Mongoose cast error (invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    return {
      statusCode: 400,
      message: handleMongooseCastError(err),
    };
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return {
      statusCode: 401,
      message: "Invalid token",
    };
  }

  if (err.name === "TokenExpiredError") {
    return {
      statusCode: 401,
      message: "Token expired",
    };
  }

  // SyntaxError (JSON parse error)
  if (err instanceof SyntaxError) {
    return {
      statusCode: 400,
      message: "Invalid JSON",
    };
  }

  // Default: Internal server error
  // Don't expose internal error messages in production
  const isProduction = process.env.NODE_ENV === "production";
  return {
    statusCode: err.statusCode || 500,
    message: isProduction ? "Internal Server Error" : err.message,
  };
};

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const { statusCode, message } = getErrorInfo(err);

  const response: ApiResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  // Include stack trace in development
  if (process.env.NODE_ENV !== "production" && err.stack) {
    (response as any).stack = err.stack;
  }

  res.status(statusCode).json(response);
};

// Async wrapper to catch errors in route handlers
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
