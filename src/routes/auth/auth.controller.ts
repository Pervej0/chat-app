import { Response } from 'express';
import { authService } from '../../services/auth.service';
import { AuthRequest, ApiResponse } from '../../types';

interface RegisterBody {
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface RefreshBody {
  refreshToken: string;
}

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body as RegisterBody;

  if (!email || !password) {
    const response: ApiResponse = {
      success: false,
      message: 'Email and password are required',
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }

  if (password.length < 6) {
    const response: ApiResponse = {
      success: false,
      message: 'Password must be at least 6 characters',
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }

  const existingUser = authService.findUserByEmail(email);
  if (existingUser) {
    const response: ApiResponse = {
      success: false,
      message: 'Email already registered',
      timestamp: new Date().toISOString(),
    };
    res.status(409).json(response);
    return;
  }

  const user = authService.createUser(email, password);
  const tokens = authService.generateTokens(user);
  authService.storeRefreshToken(tokens.refreshToken);

  const response: ApiResponse = {
    success: true,
    data: { user: { id: user.id, email: user.email, createdAt: user.createdAt }, ...tokens },
    message: 'Registration successful',
    timestamp: new Date().toISOString(),
  };
  res.status(201).json(response);
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body as LoginBody;

  if (!email || !password) {
    const response: ApiResponse = {
      success: false,
      message: 'Email and password are required',
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }

  const user = authService.findUserByEmail(email);
  if (!user || !authService.verifyPassword(password, user.passwordHash)) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid email or password',
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
    return;
  }

  // Remove old refresh token if exists (single session)
  const tokens = authService.generateTokens(user);
  authService.storeRefreshToken(tokens.refreshToken);

  const response: ApiResponse = {
    success: true,
    data: { user: { id: user.id, email: user.email, createdAt: user.createdAt }, ...tokens },
    message: 'Login successful',
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
};

export const refresh = async (req: AuthRequest, res: Response): Promise<void> => {
  const { refreshToken } = req.body as RefreshBody;

  if (!refreshToken) {
    const response: ApiResponse = {
      success: false,
      message: 'Refresh token is required',
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }

  try {
    const payload = authService.verifyRefreshToken(refreshToken);

    if (!authService.isRefreshTokenValid(refreshToken)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid or revoked refresh token',
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
      return;
    }

    const user = authService.findUserById(payload.userId);
    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
      return;
    }

    // Generate new access token (keep same refresh token)
    const tokens = authService.generateTokens(user);

    const response: ApiResponse = {
      success: true,
      data: tokens,
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid or expired refresh token',
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  const { refreshToken } = req.body as RefreshBody;

  if (refreshToken) {
    authService.removeRefreshToken(refreshToken);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Logout successful',
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
};