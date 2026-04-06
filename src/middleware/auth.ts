import { Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest, ApiResponse, TokenPayload } from '../types';

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const response: ApiResponse = {
      success: false,
      message: 'Access token required',
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload: TokenPayload = authService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid or expired access token',
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
  }
};