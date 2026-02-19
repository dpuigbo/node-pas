import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),
  APP_URL: z.string().url().default('http://localhost:5173'),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    // In development, allow startup with warnings
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Running with default/missing env vars (development mode)');
      return {
        NODE_ENV: process.env.NODE_ENV || 'development',
        PORT: Number(process.env.PORT) || 3000,
        DATABASE_URL: process.env.DATABASE_URL || '',
        JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
        GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
        APP_URL: process.env.APP_URL || 'http://localhost:5173',
      } as z.infer<typeof envSchema>;
    }
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
