import { Redis } from '@upstash/redis';
import { env } from '../server/env';
import { logger } from '../utils/logger';

export interface IRedisClient {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options?: { ex?: number; px?: number; nx?: boolean }): Promise<'OK' | null>;
  del(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ping(): Promise<string>;
}

/**
 * Memory fallback when Upstash credentials are not provided (e.g. offline dev, testing)
 */
class MemoryRedisClient implements IRedisClient {
  private store = new Map<string, { value: any; expiresAt?: number }>();

  async get<T = unknown>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set(key: string, value: unknown, options?: { ex?: number; px?: number; nx?: boolean }): Promise<'OK' | null> {
    if (options?.nx && this.store.has(key)) {
      const existing = this.store.get(key);
      if (!existing?.expiresAt || Date.now() <= existing.expiresAt) {
        return null;
      }
    }
    let expiresAt: number | undefined;
    if (options?.ex) {
      expiresAt = Date.now() + options.ex * 1000;
    } else if (options?.px) {
      expiresAt = Date.now() + options.px;
    }
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const deleted = this.store.delete(key);
    return deleted ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const existing = await this.get<number>(key);
    const nextVal = (typeof existing === 'number' ? existing : 0) + 1;
    this.store.set(key, { value: nextVal });
    return nextVal;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ping(): Promise<string> {
    return 'PONG (in-memory mock)';
  }
}

let redisInstance: IRedisClient;

if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN && env.UPSTASH_REDIS_REST_URL.startsWith('http')) {
  try {
    const upstash = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
    redisInstance = upstash as unknown as IRedisClient;
    logger.info('Connected to Upstash Redis REST');
  } catch (err: any) {
    logger.warn('Failed initializing Upstash Redis, falling back to in-memory store:', { error: err.message });
    redisInstance = new MemoryRedisClient();
  }
} else {
  logger.info('Using memory-backed Redis interface (offline/dev/test mode)');
  redisInstance = new MemoryRedisClient();
}

export const redis = redisInstance;
