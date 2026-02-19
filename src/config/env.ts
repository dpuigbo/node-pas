import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16).default('dev-secret-change-in-production'),
  MICROSOFT_CLIENT_ID: z.string().default(''),
  MICROSOFT_CLIENT_SECRET: z.string().default(''),
  MICROSOFT_CALLBACK_URL: z.string().default('http://localhost:3000/api/auth/microsoft/callback'),
  APP_URL: z.string().default('http://localhost:5173'),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    console.warn('Running with defaults for missing optional vars');
    return {
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      PORT: Number(process.env.PORT) || 3000,
      DATABASE_URL: process.env.DATABASE_URL || '',
      JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
      MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID || '',
      MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET || '',
      MICROSOFT_CALLBACK_URL: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3000/api/auth/microsoft/callback',
      APP_URL: process.env.APP_URL || 'http://localhost:5173',
    } as z.infer<typeof envSchema>;
  }
  return parsed.data;
}

export const env = loadEnv();
