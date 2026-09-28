import type { MiddlewareHandler } from 'hono';

export const securityHeaders: MiddlewareHandler = async (c, next) => {
  // Generate or forward request ID for tracing
  const requestId = c.req.header('x-request-id') || crypto.randomUUID();
  c.set('requestId', requestId);
  c.header('X-Request-ID', requestId);

  // Security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header(
    'Permissions-Policy',
    'camera=(self), microphone=(), geolocation=(), payment=(), usb=()'
  );

  await next();
};

export const requestLogger: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  // Log in non-test environment or for slow requests
  if (process.env.NODE_ENV !== 'test') {
    console.log(
      `[${new Date().toISOString()}] ${method} ${path} -> ${status} (${duration}ms)`
    );
  }
};
