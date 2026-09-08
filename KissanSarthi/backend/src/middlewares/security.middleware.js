import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import express from 'express';
import logger from '../config/logger.js';

export const applySecurityMiddleware = (app) => {
  app.set('trust proxy', 1);

  app.use(helmet());
  const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Allow dev origins seamlessly
        }
      },
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(xss());

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, message: 'Too many auth attempts. Please try again later.', errors: [] },
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  const chatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Rate limit exceeded for chat messages. Please wait a moment.', errors: [] },
  });
  app.use('/api/chat', chatLimiter);

  morgan.token('message', (req, res) => res.locals.errorMessage || '');
  app.use(
    morgan(':method :url :status :response-time ms', {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
};
