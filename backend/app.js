// Configurazione EventHub API
// Questo modulo configura l'applicazione EventHub API.
// Include la configurazione del database, del server, del CORS, del JWT, e della creazione dell'applicazione Express.
// Inoltre, inizializza il server Socket.io e configura il middleware per il parsing dei JSON e delle URL-encoded.
// Configurazione EventHub API con Socket.io

const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const configDB = require('./config/configDB');
const configJWT = require('./config/configJWT');
const app = express();
const initSocket = require('./socket');
const { httpServer, io } = initSocket(app);

// Passa io al controller chat
const chatController = require('./controllers/userChatController');
chatController.setSocketIO(io);

// Middleware
app.use(cors({
  origin: configDB.corsOrigin,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

// Usa le rotte
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

// Rotta di test
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'EventHub API funziona!',
    timestamp: new Date().toISOString()
  });
});

// Rotta root
app.get('/', (req, res) => {
  res.json({ 
    message: 'Benvenuto in EventHub API!',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        verify: 'GET /api/auth/verify',
        me: 'GET /api/auth/me'
      },
      user: {
        profile: 'GET /api/user/profile',
        updateProfile: 'PUT /api/user/profile',
        changePassword: 'PUT /api/user/change-password',
        createEvent: 'POST /api/user/events',
        joinEvent: 'POST /api/user/events/:eventId/join',
        myEvents: 'GET /api/user/events',
        chat: 'POST /api/user/events/:eventId/chat',
        getChat: 'GET /api/user/events/:eventId/chat'
      },
      admin: {
        users: 'GET /api/admin/users',
        toggleBlock: 'PATCH /api/admin/users/:userId/block',
        promote: 'PATCH /api/admin/users/:userId/promote',
        demote: 'PATCH /api/admin/users/:userId/demote',
        stats: 'GET /api/admin/stats'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Risorsa non trovata' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Errore:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Errore del server',
    error: configDB.nodeEnv === 'development' ? err.message : undefined
  });
});

// Connetti a MongoDB
mongoose.connect(configDB.mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connesso a MongoDB');
  
  // Avvia server
  const PORT = configDB.port;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server avviato su porta ${PORT}`);
    console.log(`🔒 Ambiente: ${configDB.nodeEnv}`);
    console.log(`🌐 CORS abilitato per: ${configDB.corsOrigin}`);
    console.log(`💬 Socket.io attivo per chat real-time`);
  });
})
.catch((error) => {
  console.error('❌ Errore connessione MongoDB:', error);
  process.exit(1);
});

module.exports = { app, io };