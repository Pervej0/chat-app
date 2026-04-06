import { Request, Response, NextFunction } from 'express';

export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
}

// Auth types
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}