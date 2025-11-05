const http = require('http');
const { Server } = require('socket.io');
const config = require('./config/config');

const initSocket = (app) => {
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST']
    }
  });

  return { httpServer, io };
};

module.exports = initSocket;