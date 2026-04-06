import morgan from 'morgan';
import { Request, Response } from 'express';

const stream = {
  write: (message: string): void => {
    process.stdout.write(message);
  },
};

const skip = (): boolean => {
  return process.env.NODE_ENV === 'test';
};

export const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream, skip }
);