const http = require('http');
const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io;

const initWebSockets = (app) => {
  const server = http.createServer(app);
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    
    socket.on('join-org', (orgId) => {
      socket.join(orgId);
      logger.info(`Socket ${socket.id} joined organization: ${orgId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return server;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

const emitToOrg = (orgId, event, data) => {
  if (io) {
    io.to(orgId).emit(event, data);
  }
};

module.exports = { initWebSockets, getIO, emitToOrg };
