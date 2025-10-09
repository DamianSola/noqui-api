import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { PasswordUtils } from '../utils/password.utils';
import { 
  RegisterInput, 
  LoginInput, 
  AuthResponse,
  JwtPayload 
} from '../types/auth.types';


const prisma = new PrismaClient();

export class AuthService {
  private static generateToken(payload: JwtPayload): string {
    
    return jwt.sign(
      payload, 
      config.jwt.secret as jwt.Secret, // Cast a tipo correcto
      {
        expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'], // Cast opcional
      }
    );
  }

  static async register(userData: RegisterInput): Promise<AuthResponse> {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        return {
          success: false,
          message: 'El usuario ya existe',
        };
      }

      // Validar fortaleza de contraseña
      if (!PasswordUtils.validatePasswordStrength(userData.password)) {
        return {
          success: false,
          message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
        };
      }

      // Hash de la contraseña
      const hashedPassword = await PasswordUtils.hashPassword(userData.password);

      // Crear usuario
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
        },
      });

      // Generar token
      const token = this.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        },
      };

    } catch (error) {
      console.error('Error en registro:', error);
      return {
        success: false,
        message: 'Error interno del servidor',
      };
    }
  }

  static async login(credentials: LoginInput): Promise<AuthResponse> {
    try {
      // Buscar usuario
      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user) {
        return {
          success: false,
          message: 'Credenciales inválidas',
        };
      }

      // Verificar contraseña
      const isValidPassword = await PasswordUtils.comparePassword(
        credentials.password,
        user.password
      );

      if (!isValidPassword) {
        return {
          success: false,
          message: 'Credenciales inválidas',
        };
      }

      // Generar token
      const token = this.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        success: true,
        message: 'Login exitoso',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        },
      };

    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        message: 'Error interno del servidor',
      };
    }
  }

  static async logout(token: string): Promise<AuthResponse> {
    // En un sistema más avanzado, podrías invalidar el token aquí
    // Por ahora, el logout es manejado en el cliente eliminando el token
    return {
      success: true,
      message: 'Logout exitoso',
    };
  }

  static async getCurrentUser(userId: string): Promise<AuthResponse> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return {
          success: false,
          message: 'Usuario no encontrado',
        };
      }

      return {
        success: true,
        message: 'Usuario obtenido exitosamente',
        data: {
          user,
        },
      };

    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      return {
        success: false,
        message: 'Error interno del servidor',
      };
    }
  }
}