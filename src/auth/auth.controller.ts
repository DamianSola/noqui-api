import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { ResponseHandler } from '../utils/apiResponse';
import { validate } from '../middlewares/validation.middleware';

// Esquemas de validación
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  name: z.string().min(1, 'El nombre es requerido'),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export class AuthController {
  static register = [
    validate(registerSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const result = await AuthService.register(req.body);

        if (!result.success) {
          ResponseHandler.error(res, result.message, 400);
          return;
        }

        ResponseHandler.created(res, result.message, result.data);
      } catch (error) {
        console.error('Error en controlador de registro:', error);
        ResponseHandler.error(res, 'Error interno del servidor', 500);
      }
    },
  ];

  static login = [
    validate(loginSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const result = await AuthService.login(req.body);

        if (!result.success) {
          ResponseHandler.error(res, result.message, 401);
          return;
        }

        ResponseHandler.success(res, result.message, result.data);
      } catch (error) {
        console.error('Error en controlador de login:', error);
        ResponseHandler.error(res, 'Error interno del servidor', 500);
      }
    },
  ];

  static logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers['authorization']?.split(' ')[1];
      const result = await AuthService.logout(token || '');

      ResponseHandler.success(res, result.message);
    } catch (error) {
      console.error('Error en controlador de logout:', error);
      ResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  };

  static getMe = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      console.log(userId)
      
      if (!userId) {
        ResponseHandler.error(res, 'No autenticado', 401);
        return;
      }

      const result = await AuthService.getCurrentUser(userId);

      if (!result.success) {
        ResponseHandler.error(res, result.message, 404);
        return;
      }
      console.log(result)

      ResponseHandler.success(res, result.message, result.data);
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      ResponseHandler.error(res, 'Error interno del servidor', 500);
    }
  };
}