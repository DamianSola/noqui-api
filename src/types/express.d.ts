import type { JwtPayload } from './auth.types';

declare global {
  namespace Express {
    interface Request {
      /** Payload JWT (AuthService) */
      user?: JwtPayload;
    }
  }
}

export {};
