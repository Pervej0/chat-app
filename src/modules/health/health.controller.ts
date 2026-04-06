import { Request, Response } from 'express';
import { ApiResponse } from '../../types';

export const healthCheck = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
};