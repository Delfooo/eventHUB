const http = require('http');
const { Server } = require('socket.io');
const configDB = require('./config/configDB');

const initSocket = (app) => {
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: configDB.corsOrigin,
      methods: ['GET', 'POST']
    }
  });

  return { httpServer, io };
};

module.exports = initSocket;