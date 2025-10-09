import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export class ResponseHandler {
  static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = 200
  ): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    error?: string
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      error: error || message,
    });
  }

  static created<T>(
    res: Response,
    message: string,
    data?: T
  ): Response {
    return this.success(res, message, data, 201);
  }
}