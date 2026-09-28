import { describe, it, expect } from 'vitest';
import { env } from './env';

describe('Environment Configuration Validation', () => {
  it('Has valid default configuration for development and test', () => {
    expect(env).toBeDefined();
    expect(['development', 'test', 'production']).toContain(env.NODE_ENV);
    expect(typeof env.PORT).toBe('number');
    expect(env.SESSION_SECRET.length).toBeGreaterThanOrEqual(16);
    expect(env.CSRF_SECRET.length).toBeGreaterThanOrEqual(16);
  });
});
