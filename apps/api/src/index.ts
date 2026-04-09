import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { env } from './utils/env';

// Routes
import verifyRouter from './routes/verify';
import analyzeRouter from './routes/analyze';
import chatRouter from './routes/chat';
import authRouter from './routes/auth';
import dashboardRouter from './routes/dashboard';
import publicRouter from './routes/public';
import { ApiResponse } from './utils/api-response';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return env.CLIENT_URL;
    if (origin === env.CLIENT_URL) return origin;
    if (origin.startsWith('chrome-extension://')) return origin;
    return env.CLIENT_URL;
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/health', (c) => {
  return ApiResponse.success(c, 'Service healthy', {
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Route registration
app.route('/verify', verifyRouter);
app.route('/analyze', analyzeRouter);
app.route('/chat', chatRouter);
app.route('/auth', authRouter);
app.route('/dashboard', dashboardRouter);
app.route('/public', publicRouter);

app.onError((error, c) => {
  console.error('[API Error]', error);
  return ApiResponse.error(c, 'Internal server error', 'INTERNAL_SERVER_ERROR', 500);
});

console.log(`Vouch server running on port ${env.PORT}`);

export default {
  port: env.PORT,
  fetch: app.fetch,
  idleTimeout: 120,
};