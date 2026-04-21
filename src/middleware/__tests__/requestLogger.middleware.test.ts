import { Request, Response } from "express";
import { requestLogger } from "../requestLogger";

describe("requestLogger", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe("is a valid middleware", () => {
    it("is a function that accepts req, res, next parameters", () => {
      expect(typeof requestLogger).toBe("function");
      expect(requestLogger.length).toBe(3);
    });
  });
});