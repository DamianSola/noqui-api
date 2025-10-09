import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  next(createError(`Route not found - ${req.originalUrl}`, 404));
};