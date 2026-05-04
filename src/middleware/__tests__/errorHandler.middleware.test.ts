import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import {
  errorHandler,
  CustomError,
  asyncHandler,
  AppError,
} from "../errorHandler";
import { ApiResponse } from "../../types";

describe("errorHandler", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockReq = {};
    mockRes = { status: mockStatus, json: mockJson } as Partial<Response>;
    mockNext = jest.fn();
  });

  describe("CustomError", () => {
    it("uses the error's statusCode and message", () => {
      const error = new CustomError("Not Found", 404);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Not Found",
        }),
      );
    });
  });

  describe("Mongoose ValidationError", () => {
    it("returns 400 with joined error messages", () => {
      const validationError = new mongoose.Error.ValidationError();
      validationError.errors = {
        email: new mongoose.Error.ValidatorError({ message: "Invalid email" }),
        name: new mongoose.Error.ValidatorError({ message: "Name required" }),
      } as any;

      errorHandler(
        validationError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid email, Name required",
        }),
      );
    });
  });

  describe("Mongoose CastError (invalid ObjectId)", () => {
    it("returns 400 with cast error message", () => {
      const castError = new mongoose.Error.CastError(
        "ObjectId",
        "invalid-id",
        "somepath",
      );

      errorHandler(
        castError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid somepath: invalid-id",
        }),
      );
    });
  });

  describe("Mongoose duplicate key error (code 11000)", () => {
    it("returns 409 with field already exists message", () => {
      const dupError = new Error() as AppError;
      dupError.code = 11000;
      (dupError as any).keyPattern = { email: 1 };

      errorHandler(dupError, mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "email already exists",
        }),
      );
    });

    it("returns 409 with generic message when no keyPattern", () => {
      const dupError = new Error() as AppError;
      dupError.code = 11000;

      errorHandler(dupError, mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Field already exists",
        }),
      );
    });
  });

  describe("JsonWebTokenError", () => {
    it("returns 401 with invalid token message", () => {
      const jwtError = new Error("invalid signature");
      jwtError.name = "JsonWebTokenError";

      errorHandler(jwtError, mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid token",
        }),
      );
    });
  });

  describe("TokenExpiredError", () => {
    it("returns 401 with token expired message", () => {
      const expiredError = new Error("jwt expired");
      expiredError.name = "TokenExpiredError";

      errorHandler(
        expiredError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Token expired",
        }),
      );
    });
  });

  describe("ZodError", () => {
    it("returns 400 with validation failure message", () => {
      const zodError = new ZodError([
        {
          code: "invalid_type",
          path: ["body", "email"],
          message: "Required",
        },
      ] as any);

      errorHandler(zodError, mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Validation failed: body.email Required",
        }),
      );
    });
  });

  describe("SyntaxError (JSON parse error)", () => {
    it("returns 400 with invalid JSON message", () => {
      const syntaxError = new SyntaxError("Unexpected token");

      errorHandler(
        syntaxError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid JSON",
        }),
      );
    });
  });

  describe("generic Error without statusCode", () => {
    it("returns 500 with message in non-production", () => {
      const error = new Error("Something went wrong");
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Something went wrong",
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("returns generic message in production", () => {
      const error = new Error("Database connection failed");
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Internal Server Error",
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("stack trace in development", () => {
    it("includes stack in response when NODE_ENV is development", () => {
      const error = new Error("Test error");
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = mockJson.mock.calls[0][0];
      expect(response.stack).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });
});

describe("asyncHandler", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};
    mockNext = jest.fn();
  });

  it("calls next with error when handler throws", async () => {
    const error = new Error("Async error");
    const handler = jest.fn().mockRejectedValue(error);
    const wrapped = asyncHandler(handler);

    wrapped(mockReq as Request, mockRes as Response, mockNext);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it("does not call next when handler resolves", async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(handler);

    wrapped(mockReq as Request, mockRes as Response, mockNext);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockNext).not.toHaveBeenCalled();
  });
});
