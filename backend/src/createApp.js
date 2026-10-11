import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { uploadsDir } from './lib.js';
import { adminAuthRouter, authRouter } from './authRoutes.js';
import { publicRouter } from './publicRoutes.js';
import { meRouter } from './meRoutes.js';
import { adminRouter } from './adminRoutes.js';

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const origins = [process.env.CLIENT_ORIGIN, process.env.ADMIN_ORIGIN].filter(Boolean);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || origins.includes(origin)) callback(null, true);
        else callback(new Error('Not allowed by CORS'));
      },
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use('/uploads', express.static(uploadsDir));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 20 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'tchadvoiture-api' });
  });

  app.use('/api/auth/signup', authLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/admin/auth/login', authLimiter);

  app.use('/api/auth', authRouter);
  app.use('/api/admin/auth', adminAuthRouter);
  app.use('/api', publicRouter);
  app.use('/api/me', meRouter);
  app.use('/api/admin', adminRouter);

  app.use((err, _req, res, _next) => {
    if (err?.name === 'CastError') {
      res.status(400).json({ error: 'Invalid id.' });
      return;
    }
    if (err?.code === 11000) {
      res.status(409).json({ error: 'That value is already in use.' });
      return;
    }
    if (err?.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'Image must be 5 MB or smaller.' });
      return;
    }
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: err.message || 'Server error' });
  });

  return app;
}
