const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const dotenv = require('dotenv');

// Carica variabili di ambiente
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database temporaneo in memoria (per test)
const users = [];
const userIdCounter = 1;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'eventhub-super-secret-jwt-key-2024';

// Helper functions
const findUserByEmail = (email) => users.find(user => user.email === email);
const findUserByUsername = (username) => users.find(user => user.username === username);
const findUserById = (id) => users.find(user => user.id === id);

// Auth Routes

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tutti i campi sono richiesti' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'La password deve essere di almeno 6 caratteri' 
      });
    }

    // Controllo se utente esiste già
    if (findUserByEmail(email) || findUserByUsername(username)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email o username già registrati'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crea nuovo utente
    const newUser = {
      id: userIdCounter,
      username,
      email,
      password: hashedPassword,
      role: 'user',
      isActive: true,
      createdAt: new Date(),
      lastLogin: null
    };

    users.push(newUser);

    // Genera token JWT
    const token = jwt.sign(
      { 
        userId: newUser.id,
        username: newUser.username,
        role: newUser.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Rimuovi password dalla risposta
    const userResponse = { ...newUser };
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'Utente registrato con successo',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Errore registrazione:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore durante la registrazione',
      error: error.message 
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email e password sono richieste' 
      });
    }

    // Trova utente
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenziali non valide' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account disabilitato' 
      });
    }

    // Confronta password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenziali non valide' 
      });
    }

    // Aggiorna ultimo login
    user.lastLogin = new Date();

    // Genera token JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Rimuovi password dalla risposta
    const userResponse = { ...user };
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Login effettuato con successo',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Errore login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore durante il login',
      error: error.message 
    });
  }
});

// Middleware di autenticazione
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token non fornito' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = findUserById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utente non valido' 
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('Errore autenticazione:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token non valido' 
    });
  }
};

// Logout
app.post('/api/auth/logout', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout effettuato con successo'
  });
});

// Verify Token
app.get('/api/auth/verify', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Token valido',
    data: {
      user: req.user
    }
  });
});

// Get Current User
app.get('/api/auth/me', authenticate, (req, res) => {
  const userResponse = { ...req.user };
  delete userResponse.password;
  
  res.json({
    success: true,
    data: {
      user: userResponse
    }
  });
});

// Test Route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'EventHub API funziona!',
    timestamp: new Date().toISOString(),
    totalUsers: users.length
  });
});

// Root Route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Benvenuto in EventHub API! (Modalità Test)',
    version: '1.0.0',
    mode: 'MEMORY_DB',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      logout: 'POST /api/auth/logout',
      verify: 'GET /api/auth/verify',
      me: 'GET /api/auth/me',
      test: 'GET /api/test'
    }
  });
});

// Error handlers
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Risorsa non trovata' 
  });
});

app.use((err, req, res, next) => {
  console.error('Errore:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Errore del server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server EventHub avviato su porta ${PORT}`);
  console.log(`📍 Modalità: Test (Database in memoria)`);
  console.log(`🌐 CORS abilitato per: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log('');
  console.log('📝 Endpoints disponibili:');
  console.log(`   POST   http://localhost:${PORT}/api/auth/register`);
  console.log(`   POST   http://localhost:${PORT}/api/auth/login`);
  console.log(`   POST   http://localhost:${PORT}/api/auth/logout`);
  console.log(`   GET    http://localhost:${PORT}/api/auth/verify`);
  console.log(`   GET    http://localhost:${PORT}/api/auth/me`);
  console.log(`   GET    http://localhost:${PORT}/api/test`);
});

module.exports = app;