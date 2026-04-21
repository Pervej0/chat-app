import { Request, Response, NextFunction } from "express";
import { authMiddleware } from "../auth";
import { authService } from "../../modules/auth/auth.service";
import { AuthRequest, TokenPayload } from "../../types";

jest.mock("../../modules/auth/auth.service");

const VALID_USER_ID = "507f1f77bcf86cd799439012";

describe("authMiddleware", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockReq = { headers: {} };
    mockRes = { status: mockStatus, json: mockJson } as Partial<Response>;
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("when authorization header is missing", () => {
    it("returns 401 with no token message", () => {
      mockReq.headers = {};

      authMiddleware(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Access token required",
        }),
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("when authorization header does not start with Bearer", () => {
    it("returns 401", () => {
      mockReq.headers = { authorization: "Basic sometoken" };

      authMiddleware(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Access token required",
        }),
      );
    });
  });

  describe("when token is invalid or expired", () => {
    it("returns 401 with invalid token message", () => {
      mockReq.headers = { authorization: "Bearer invalidtoken" };
      (authService.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error("invalid token");
      });

      authMiddleware(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid or expired access token",
        }),
      );
    });

    it("returns 401 for expired token", () => {
      mockReq.headers = { authorization: "Bearer expiredtoken" };
      const expiredError = new Error("jwt expired");
      expiredError.name = "TokenExpiredError";
      (authService.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw expiredError;
      });

      authMiddleware(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid or expired access token",
        }),
      );
    });
  });

  describe("when token is valid", () => {
    it("attaches user payload to req.user and calls next", () => {
      const payload: TokenPayload = {
        userId: VALID_USER_ID,
        email: "test@example.com",
      };
      mockReq.headers = { authorization: "Bearer validtoken" };
      (authService.verifyAccessToken as jest.Mock).mockReturnValue(payload);

      authMiddleware(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockReq.user).toEqual(payload);
      expect(mockNext).toHaveBeenCalled();
      expect(mockStatus).not.toHaveBeenCalled();
    });
  });
});