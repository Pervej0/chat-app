import { Response } from "express";
import { authService } from "./auth.service";
import { AuthRequest, ApiResponse } from "../../types";
import { asyncHandler } from "../../middleware/errorHandler";
import { RegisterInput, LoginInput } from "../../schemas/auth.schema";
import { ConflictError, UnauthorizedError, BadRequestError } from "../../utils/errors";

export const register = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password, name } = req.body as RegisterInput;

  try {
    const { user, tokens } = await authService.register({
      email,
      password,
      name,
    });

    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
        ...tokens,
      },
      message: "Registration successful",
      timestamp: new Date().toISOString(),
    };
    res.status(201).json(response);
  } catch (error: any) {
    if (error.message === "EMAIL_EXISTS") {
      throw new ConflictError("Email already registered");
    }
    throw error;
  }
});

export const login = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body as LoginInput;

  try {
    const { user, tokens } = await authService.login({ email, password });

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
        accessToken: tokens.accessToken,
      },
      message: "Login successful",
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error: any) {
    throw new UnauthorizedError("Invalid email or password");
  }
});

export const refresh = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new BadRequestError("Refresh token is required");
  }

  try {
    const { user, tokens } = await authService.refreshToken(refreshToken);

    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
        ...tokens,
      },
      message: "Token refreshed successfully",
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error: any) {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (userId) {
    await authService.logout(userId);
  }

  const response: ApiResponse = {
    success: true,
    message: "Logout successful",
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
});

export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    throw new BadRequestError("Email is required");
  }

  await authService.forgotPassword({ email });

  const response: ApiResponse = {
    success: true,
    message: "If the email exists, a password reset link has been sent",
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
});

export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw new BadRequestError("Token and new password are required");
  }

  if (password.length < 6) {
    throw new BadRequestError("Password must be at least 6 characters");
  }

  try {
    await authService.resetPassword(token, password);

    const response: ApiResponse = {
      success: true,
      message: "Password reset successful",
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error: any) {
    throw new BadRequestError("Invalid or expired reset token");
  }
});
