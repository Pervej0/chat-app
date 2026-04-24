import { Response } from "express";
import { authService } from "./auth.service";
import { AuthRequest, ApiResponse } from "../../types";

interface RegisterBody {
  email: string;
  password: string;
  name: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface RefreshBody {
  refreshToken: string;
}

interface ForgotPasswordBody {
  email: string;
}

interface ResetPasswordBody {
  token: string;
  password: string;
}

export const register = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { email, password, name } = req.body as RegisterBody;

  if (!email || !password || !name) {
    const response: ApiResponse = {
      success: false,
      message: "Email, password, and name are required",
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }

  if (password.length < 6) {
    const response: ApiResponse = {
      success: false,
      message: "Password must be at least 6 characters",
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }

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
    const response: ApiResponse = {
      success: false,
      message:
        error.message === "EMAIL_EXISTS"
          ? "Email already registered"
          : "Registration failed",
      timestamp: new Date().toISOString(),
    };
    res.status(409).json(response);
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body as LoginBody;

  if (!email || !password) {
    const response: ApiResponse = {
      success: false,
      message: "Email and password are required",
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }

  try {
    const { user, tokens } = await authService.login({ email, password });

    // ✅ Set refresh token in cookie
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true, // prevent JS access (security)
      secure: process.env.NODE_ENV === "production", // HTTPS only in prod
      sameSite: "strict", // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
        accessToken: tokens.accessToken, // ✅ send only access token in body
      },
      message: "Login successful",
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      message: "Invalid email or password",
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
  }
};

export const refresh = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { refreshToken } = req.body as RefreshBody;

  if (!refreshToken) {
    const response: ApiResponse = {
      success: false,
      message: "Refresh token is required",
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
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
    const response: ApiResponse = {
      success: false,
      message: "Invalid or expired refresh token",
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
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
};

export const forgotPassword = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { email } = req.body as ForgotPasswordBody;

  if (!email) {
    const response: ApiResponse = {
      success: false,
      message: "Email is required",
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }

  await authService.forgotPassword({ email });

  // Always return success to not reveal if email exists
  const response: ApiResponse = {
    success: true,
    message: "If the email exists, a password reset link has been sent",
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
};

export const resetPassword = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { token, password } = req.body as ResetPasswordBody;

  if (!token || !password) {
    const response: ApiResponse = {
      success: false,
      message: "Token and new password are required",
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }

  if (password.length < 6) {
    const response: ApiResponse = {
      success: false,
      message: "Password must be at least 6 characters",
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
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
    const response: ApiResponse = {
      success: false,
      message: "Invalid or expired reset token",
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
  }
};
