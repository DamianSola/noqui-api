import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { createError } from './errorHandler';
import dotenv from 'dotenv'

dotenv.config()

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        console.log( JSON.stringify(errorMessages))
        return next(createError('Datos de entrada inválidos', 400)); // Sin JSON.stringify
      }
      next(error);
    }
  };
};