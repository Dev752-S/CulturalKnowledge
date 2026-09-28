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

  it('POST /api/v1/participant/team rejects unauthenticated requests with 401', async () => {
    const res = await app.request('/api/v1/participant/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName: 'Test Team' }),
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('Flow: Google login establishes session, POST /team registers team name', async () => {
    // 1. Google login
    const loginRes = await app.request('/api/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teamtest@example.com',
        name: 'Team Tester',
      }),
    });
    expect(loginRes.status).toBe(200);
    const loginBody = (await loginRes.json()) as any;
    expect(loginBody.success).toBe(true);
    expect(loginBody.hasTeamName).toBe(false);

    const setCookie = loginRes.headers.get('set-cookie');
    expect(setCookie).toContain('skp_session=');

    // 2. Submit team name with session cookie
    const teamRes = await app.request('/api/v1/participant/team', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: setCookie || '',
      },
      body: JSON.stringify({ teamName: 'Quantum Coders' }),
    });
    expect(teamRes.status).toBe(200);
    const teamBody = (await teamRes.json()) as any;
    expect(teamBody.success).toBe(true);
    expect(teamBody.teamName).toBe('Quantum Coders');

    // 3. Verify /me now reports hasTeamName: true
    const meRes = await app.request('/api/v1/auth/me', {
      headers: { Cookie: setCookie || '' },
    });
    const meBody = (await meRes.json()) as any;
    expect(meBody.hasTeamName).toBe(true);
    expect(meBody.user.teamName).toBe('Quantum Coders');
  });
});
