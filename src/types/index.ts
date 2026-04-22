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
  role: "user" | "admin" | "superadmin";
  createdAt: Date;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: "user" | "admin" | "superadmin";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}