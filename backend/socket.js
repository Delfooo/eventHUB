// Socket.io Configuration con User Rooms per Notifiche
// Questo modulo configura il server Socket.io per l'applicazione.
// Include la creazione del server HTTP, l'inizializzazione di Socket.io, e la configurazione del CORS.

const http = require('http');
const socketIo = require('socket.io');

const initSocket = (app) => {
  const httpServer = http.createServer(app);
  
  const io = socketIo(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Map per tenere traccia degli utenti connessi
  const userSockets = new Map();

  io.on('connection', (socket) => {
    console.log('✅ Socket connesso:', socket.id);

    // Autentica utente e join user room
    socket.on('authenticate', (userId) => {
      if (userId) {
        socket.userId = userId;
        socket.join(`user-${userId}`);
        userSockets.set(userId, socket.id);
        console.log(`👤 Utente ${userId} autenticato e in room user-${userId}`);
      }
    });

    // Join event room per chat
    socket.on('joinEventRoom', (eventId) => {
      socket.join(`event-${eventId}`);
      console.log(`📅 Socket ${socket.id} entrato in event-${eventId}`);
    });

    // Leave event room
    socket.on('leaveEventRoom', (eventId) => {
      socket.leave(`event-${eventId}`);
      console.log(`👋 Socket ${socket.id} uscito da event-${eventId}`);
    });

    // Disconnessione
    socket.on('disconnect', () => {
      if (socket.userId) {
        userSockets.delete(socket.userId);
        console.log(`❌ Utente ${socket.userId} disconnesso`);
      } else {
        console.log('❌ Socket disconnesso:', socket.id);
      }
    });
  });

  return { httpServer, io };
};

module.exports = initSocket;