import { errorHandler, CustomError } from "../errorHandler";
import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const mockRes = (): any => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("errorHandler", () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {} as Request;
    res = mockRes();
    next = jest.fn();
  });

  it("handles CustomError with 400", () => {
    const err = new CustomError("Bad request", 400);
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Bad request" }),
    );
  });

  it("handles CustomError with 401", () => {
    const err = new CustomError("Unauthorized", 401);
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("handles CustomError with 403", () => {
    const err = new CustomError("Forbidden", 403);
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("handles CustomError with 404", () => {
    const err = new CustomError("Not found", 404);
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("handles CustomError with 500", () => {
    const err = new CustomError("Server error", 500);
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("handles mongoose ValidationError", () => {
    const err = new mongoose.Error.ValidationError();
    err.errors = { field: { message: "Field is required" } } as any;
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    );
  });

  it("handles mongoose CastError", () => {
    const err = new mongoose.Error.CastError("field", "invalid", "ObjectId");
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.stringContaining("Invalid") }),
    );
  });

  it("handles mongoose duplicate key error (code 11000)", () => {
    const err = { code: 11000, keyPattern: { email: 1 } } as any;
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.stringContaining("email") }),
    );
  });

  it("handles JsonWebTokenError", () => {
    const err = Object.assign(new Error("invalid token"), { name: "JsonWebTokenError" });
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Invalid token" }),
    );
  });

  it("handles TokenExpiredError", () => {
    const err = Object.assign(new Error("expired"), { name: "TokenExpiredError" });
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Token expired" }),
    );
  });

  it("handles SyntaxError as 400", () => {
    const err = new SyntaxError("Unexpected token");
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Invalid JSON" }),
    );
  });

  it("defaults to 500 for unknown errors", () => {
    const err = new Error("Something went wrong");
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    );
  });

  it("includes stack trace in non-production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const err = new Error("Boom");
    errorHandler(err, req, res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ stack: err.stack }),
    );
    process.env.NODE_ENV = originalEnv;
  });

  it("hides stack trace in production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const err = new Error("Boom");
    errorHandler(err, req, res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Internal Server Error" }),
    );
    process.env.NODE_ENV = originalEnv;
  });
});
