import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import connectDB from './config/database.js';
import logger from './config/logger.js';
import { initSocketHandlers } from './sockets/index.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  initSocketHandlers(io);
  app.set('io', io);

  server.listen(PORT, () => {
    logger.info(`KissanSarthi API running on port ${PORT} [${process.env.NODE_ENV}]`);
  });

  server.on('error', (err) => {
    logger.error(`Server error: ${err.message}`);
    process.exit(1);
  });
};

startServer();
