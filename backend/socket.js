// Configurazione Socket.io
// Questo modulo configura il server Socket.io per l'applicazione.
// Include la creazione del server HTTP, l'inizializzazione di Socket.io, e la configurazione del CORS.

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