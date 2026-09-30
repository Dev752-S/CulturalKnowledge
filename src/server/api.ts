import { getRequestListener } from '@hono/node-server';
import app from './app';

export const config = {
  runtime: 'nodejs',
};

const listener = getRequestListener(app.fetch);

export default function handler(req: any, res: any) {
  try {
    if (res && typeof res.writeHead === 'function') {
      if (req && (req.url === '/api' || req.url === '/api/')) {
        const originalUrl =
          req.headers && (req.headers['x-forwarded-uri'] || req.headers['x-matched-path']);
        if (typeof originalUrl === 'string' && originalUrl.startsWith('/api')) {
          req.url = originalUrl;
        }
      }
      return listener(req, res);
    }
    return app.fetch(req);
  } catch (err: any) {
    console.error('SERVERLESS EXECUTION ERROR:', err);
    if (res && typeof res.status === 'function') {
      return res.status(500).json({
        success: false,
        error: { message: err?.message || 'Serverless invocation error' },
      });
    }
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: err?.message || 'Serverless invocation error' },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
