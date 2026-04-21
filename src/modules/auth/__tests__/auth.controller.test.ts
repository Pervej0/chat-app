import { Response } from "express";
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
} from "../auth.controller";
import { authService } from "../auth.service";
import { AuthRequest } from "../../../types";

jest.mock("../auth.service");

const mockUser = {
  id: "507f1f77bcf86cd799439012",
  email: "test@example.com",
  name: "Test User",
  createdAt: new Date(),
};

const mockTokens = {
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
};

describe("authController", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockReq = { body: {}, user: undefined };
    mockRes = { status: mockStatus, json: mockJson } as Partial<Response>;
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("returns 400 when email, password, or name is missing", async () => {
      mockReq.body = { email: "test@test.com" };

      await register(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Email, password, and name are required",
        }),
      );
    });

    it("returns 400 when password is less than 6 characters", async () => {
      mockReq.body = { email: "test@test.com", password: "123", name: "Test" };

      await register(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Password must be at least 6 characters",
        }),
      );
    });

    it("returns 201 with user and tokens on success", async () => {
      mockReq.body = { email: "test@test.com", password: "password123", name: "Test User" };
      (authService.register as jest.Mock).mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      await register(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Registration successful",
          data: expect.objectContaining({
            user: expect.objectContaining({ id: mockUser.id, email: mockUser.email }),
            accessToken: mockTokens.accessToken,
            refreshToken: mockTokens.refreshToken,
          }),
        }),
      );
    });

    it("returns 409 when email already exists", async () => {
      mockReq.body = { email: "test@test.com", password: "password123", name: "Test User" };
      (authService.register as jest.Mock).mockRejectedValue(new Error("EMAIL_EXISTS"));

      await register(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Email already registered",
        }),
      );
    });

    it("returns 500 on unexpected error", async () => {
      mockReq.body = { email: "test@test.com", password: "password123", name: "Test User" };
      (authService.register as jest.Mock).mockRejectedValue(new Error("UNKNOWN_ERROR"));

      await register(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Registration failed",
        }),
      );
    });
  });

  describe("login", () => {
    it("returns 400 when email or password is missing", async () => {
      mockReq.body = { email: "test@test.com" };

      await login(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Email and password are required",
        }),
      );
    });

    it("returns 200 with user and tokens on success", async () => {
      mockReq.body = { email: "test@test.com", password: "password123" };
      (authService.login as jest.Mock).mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      await login(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Login successful",
          data: expect.objectContaining({
            user: expect.objectContaining({ id: mockUser.id }),
            accessToken: mockTokens.accessToken,
            refreshToken: mockTokens.refreshToken,
          }),
        }),
      );
    });

    it("returns 401 on invalid credentials", async () => {
      mockReq.body = { email: "test@test.com", password: "wrongpassword" };
      (authService.login as jest.Mock).mockRejectedValue(new Error("INVALID_CREDENTIALS"));

      await login(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid email or password",
        }),
      );
    });
  });

  describe("refresh", () => {
    it("returns 400 when refresh token is missing", async () => {
      mockReq.body = {};

      await refresh(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Refresh token is required",
        }),
      );
    });

    it("returns 200 with new tokens on success", async () => {
      mockReq.body = { refreshToken: "valid-refresh-token" };
      (authService.refreshToken as jest.Mock).mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      await refresh(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Token refreshed successfully",
          data: expect.objectContaining({
            accessToken: mockTokens.accessToken,
            refreshToken: mockTokens.refreshToken,
          }),
        }),
      );
    });

    it("returns 401 on invalid or expired refresh token", async () => {
      mockReq.body = { refreshToken: "invalid-token" };
      (authService.refreshToken as jest.Mock).mockRejectedValue(new Error("INVALID_TOKEN"));

      await refresh(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid or expired refresh token",
        }),
      );
    });
  });

  describe("logout", () => {
    it("calls authService.logout when user is authenticated", async () => {
      mockReq.user = { userId: "507f1f77bcf86cd799439012", email: "test@test.com" };
      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      await logout(mockReq as AuthRequest, mockRes as Response);

      expect(authService.logout).toHaveBeenCalledWith("507f1f77bcf86cd799439012");
    });

    it("does not call authService.logout when user is not authenticated", async () => {
      mockReq.user = undefined;

      await logout(mockReq as AuthRequest, mockRes as Response);

      expect(authService.logout).not.toHaveBeenCalled();
    });

    it("returns 200 with success message", async () => {
      mockReq.user = { userId: "507f1f77bcf86cd799439012", email: "test@test.com" };
      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      await logout(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Logout successful",
        }),
      );
    });
  });

  describe("forgotPassword", () => {
    it("returns 400 when email is missing", async () => {
      mockReq.body = {};

      await forgotPassword(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Email is required",
        }),
      );
    });

    it("returns 200 regardless of whether email exists", async () => {
      mockReq.body = { email: "test@test.com" };
      (authService.forgotPassword as jest.Mock).mockResolvedValue(undefined);

      await forgotPassword(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "If the email exists, a password reset link has been sent",
        }),
      );
    });

    it("calls authService.forgotPassword with email", async () => {
      mockReq.body = { email: "test@test.com" };
      (authService.forgotPassword as jest.Mock).mockResolvedValue(undefined);

      await forgotPassword(mockReq as AuthRequest, mockRes as Response);

      expect(authService.forgotPassword).toHaveBeenCalledWith({ email: "test@test.com" });
    });
  });

  describe("resetPassword", () => {
    it("returns 400 when token or password is missing", async () => {
      mockReq.body = { token: "some-token" };

      await resetPassword(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Token and new password are required",
        }),
      );
    });

    it("returns 400 when password is less than 6 characters", async () => {
      mockReq.body = { token: "some-token", password: "123" };

      await resetPassword(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Password must be at least 6 characters",
        }),
      );
    });

    it("returns 200 on successful password reset", async () => {
      mockReq.body = { token: "valid-reset-token", password: "newpassword123" };
      (authService.resetPassword as jest.Mock).mockResolvedValue(undefined);

      await resetPassword(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Password reset successful",
        }),
      );
    });

    it("returns 400 on invalid or expired reset token", async () => {
      mockReq.body = { token: "invalid-token", password: "newpassword123" };
      (authService.resetPassword as jest.Mock).mockRejectedValue(new Error("INVALID_TOKEN"));

      await resetPassword(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid or expired reset token",
        }),
      );
    });
  });
});