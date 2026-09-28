import { describe, it, expect } from 'vitest';
import app from './app';

describe('Hono API Backend Foundation', () => {
  it('GET /api/v1/health returns structured health check response', async () => {
    const res = await app.request('/api/v1/health');
    expect(res.status).toBeLessThanOrEqual(503);
    const body = (await res.json()) as any;
    expect(body).toHaveProperty('success');
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('service', 'SKP Skill Arena API');
    expect(body.checks).toHaveProperty('database');
    expect(body.checks).toHaveProperty('redis');
  });

  it('Injects security headers and X-Request-ID', async () => {
    const res = await app.request('/api/v1/health');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });

  it('Root /health endpoint is operational', async () => {
    const res = await app.request('/health');
    expect(res.status).toBeLessThanOrEqual(503);
    const body = (await res.json()) as any;
    expect(body.service).toBe('SKP Skill Arena API');
  });
});
