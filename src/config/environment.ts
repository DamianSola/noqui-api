import { z } from 'zod';
import dotenv from 'dotenv'

dotenv.config()


const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  API_PREFIX: z.string().default('/api/v1'),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // Auth
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  
  // CORS
  FRONTEND_URL: z.string().url().default('http://localhost:3001'),
});

// Validación con mejores mensajes de error
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path[0]).join(', ');
      console.error('❌ Error en variables de entorno:');
      console.error(`🔍 Variables faltantes o inválidas: ${missingVars}`);
      console.error('📋 Asegúrate de que tu archivo .env tenga todas las variables requeridas');
      process.exit(1);
    }
    throw error;
  }
};

const env = parseEnv();

console.log(" ")

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  databaseUrl: env.DATABASE_URL,
  nextAuth: {
    secret: env.NEXTAUTH_SECRET,
    url: env.NEXTAUTH_URL,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  frontendUrl: env.FRONTEND_URL,
} as const;