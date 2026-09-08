import logger from '../config/logger.js';
import { verifyAccessToken } from '../utils/jwt.js';

export const initSocketHandlers = (io) => {
  // Handshake authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    try {
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      logger.warn(`Socket authentication failed for ${socket.id}: ${err.message}`);
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket authenticated & connected: ${socket.id} (user: ${socket.userId})`);

    // Join user's private room
    if (socket.userId) {
      socket.join(`user_${socket.userId}`);
      socket.join(`farm:${socket.userId}`);
    }

    // Join specific 1-on-1 consultation room
    socket.on('join_consultation', (data) => {
      const consultationId = typeof data === 'string' ? data : data?.consultationId;
      if (consultationId) {
        socket.join(`consultation_${consultationId}`);
        logger.info(`User ${socket.userId} joined room consultation_${consultationId}`);
      }
    });

    socket.on('leave_consultation', (data) => {
      const consultationId = typeof data === 'string' ? data : data?.consultationId;
      if (consultationId) {
        socket.leave(`consultation_${consultationId}`);
        logger.info(`User ${socket.userId} left room consultation_${consultationId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

export const emitSensorUpdate = (io, userId, data) => {
  if (!io || !userId) return;
  io.to(`user_${userId}`).to(`farm:${userId}`).emit('sensor_update', data);
  io.to(`user_${userId}`).to(`farm:${userId}`).emit('sensor:update', data);
};

export const emitAlert = (io, userId, alert) => {
  if (!io || !userId) return;
  io.to(`user_${userId}`).to(`farm:${userId}`).emit('alert_new', alert);
  io.to(`user_${userId}`).to(`farm:${userId}`).emit('alert:new', alert);
};

export const emitNewPost = (io, post) => {
  if (!io) return;
  io.emit('post_new', post);
};

export const emitPostLiked = (io, data) => {
  if (!io) return;
  io.emit('post_liked', data);
};

export const emitFertilizerCalc = (io, userId, data) => {
  if (!io || !userId) return;
  io.to(`user_${userId}`).emit('fertilizer_calc', data);
};

export const emitCropAdvice = (io, userId, data) => {
  if (!io || !userId) return;
  io.to(`user_${userId}`).emit('crop_advice', data);
};
