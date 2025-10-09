export const AUTH_CONFIG = {
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '5h',
    issuer: 'your-app-name',
  },
  cookies: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 5 * 60 * 60 * 1000, // 5 horas
  },
  bcrypt: {
    saltRounds: 12,
  },
  validation: {
    minPasswordLength: 6,
  }
};

export const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxAttempts: 5,
};