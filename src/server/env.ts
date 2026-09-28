import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().optional().default(''),
  UPSTASH_REDIS_REST_URL: z.string().optional().default(''),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().default(''),
  SESSION_SECRET: z.string().min(16).default('skp_skill_arena_default_session_secret_2026'),
  CSRF_SECRET: z.string().min(16).default('skp_skill_arena_default_csrf_secret_2026'),
  STORAGE_ENDPOINT: z.string().optional().default(''),
  STORAGE_ACCESS_KEY: z.string().optional().default(''),
  STORAGE_SECRET_KEY: z.string().optional().default(''),
  STORAGE_BUCKET: z.string().optional().default('skill-arena-assets'),
  CORS_ORIGIN: z.string().optional().default('http://localhost:3000'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Environment variable validation failed');
}

export const env = parsedEnv.data;
export type Env = z.infer<typeof envSchema>;
