import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const response: ApiResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
};