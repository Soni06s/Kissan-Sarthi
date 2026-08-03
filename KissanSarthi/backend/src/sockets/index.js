import logger from '../config/logger.js';

export const initSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join-farm', (userId) => {
      if (userId) socket.join(`farm:${userId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

export const emitSensorUpdate = (io, userId, data) => {
  io.to(`farm:${userId}`).emit('sensor:update', data);
};

export const emitAlert = (io, userId, alert) => {
  io.to(`farm:${userId}`).emit('alert:new', alert);
};
