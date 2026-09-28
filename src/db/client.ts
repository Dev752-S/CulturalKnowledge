import { Pool as NeonPool } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '../server/env';
import * as schema from './schema';
import { logger } from '../utils/logger';

let dbInstance: any = null;
let poolInstance: any = null;

export function getDatabase() {
  if (dbInstance) return dbInstance;

  const url = env.DATABASE_URL;
  if (!url) {
    logger.warn('DATABASE_URL is not set. Database operations will fail unless configured.');
    return null;
  }

  try {
    if (url.includes('neon.tech') || url.includes('sslmode=require')) {
      logger.info('Initializing Neon Serverless PostgreSQL connection');
      poolInstance = new NeonPool({ connectionString: url });
      dbInstance = drizzleNeon(poolInstance, { schema });
    } else {
      logger.info('Initializing standard Node PostgreSQL connection pool');
      poolInstance = new pg.Pool({ connectionString: url });
      dbInstance = drizzlePg(poolInstance, { schema });
    }
    return dbInstance;
  } catch (err: any) {
    logger.error('Failed to initialize database client:', { error: err.message });
    return null;
  }
}

export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  latencyMs?: number;
}> {
  const url = env.DATABASE_URL;
  if (!url) {
    return {
      connected: false,
      message: 'DATABASE_URL not configured. Set DATABASE_URL in environment.',
    };
  }

  const start = Date.now();
  try {
    const db = getDatabase();
    if (!db) {
      return { connected: false, message: 'Database client failed to initialize' };
    }

    if (poolInstance) {
      await poolInstance.query('SELECT 1');
    }
    const latencyMs = Date.now() - start;
    return { connected: true, message: 'PostgreSQL connection operational', latencyMs };
  } catch (err: any) {
    return { connected: false, message: err.message || 'Database ping failed' };
  }
}

export const db = getDatabase();
