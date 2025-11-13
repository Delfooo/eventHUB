// Configurazione Socket.io
// Questo modulo configura il server Socket.io per l'applicazione.
// Include la creazione del server HTTP, l'inizializzazione di Socket.io, e la configurazione del CORS.

const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);

// Configurazione Socket.io con CORS
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Configurazione EJS come template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware per servire file statici (CSS, JS, immagini)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware per parsing JSON e form
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ROTTE PUBBLICHE
// Homepage - Mostra il catalogo eventi pubblici
app.get('/', (req, res) => {
  res.render('public/home', {
    title: 'EventHub - Scopri Eventi',
    page: 'home'
  });
});

// Pagina Access (Login & Register unificati)
app.get('/login', (req, res) => {
  res.render('auth/access', {
    title: 'Accedi - EventHub',
    page: 'access'
  });
});

app.get('/register', (req, res) => {
  res.render('auth/access', {
    title: 'Registrati - EventHub',
    page: 'access'
  });
});

// Rotta access diretta
app.get('/access', (req, res) => {
  res.render('auth/access', {
    title: 'Accedi o Registrati - EventHub',
    page: 'access'
  });
});

// ROTTE UTENTE (protette - verifica token lato client)
app.get('/dashboard', (req, res) => {
  res.render('user/dashboard', {
    title: 'Dashboard - EventHub',
    page: 'dashboard'
  });
});

app.get('/profile', (req, res) => {
  res.render('user/profile', {
    title: 'Profilo - EventHub',
    page: 'profile'
  });
});

app.get('/my-events', (req, res) => {
  res.render('user/my-events', {
    title: 'I Miei Eventi - EventHub',
    page: 'my-events'
  });
});

// Rotta dettaglio evento (pubblica)
app.get('/event/:id', (req, res) => {
  res.render('public/event-detail', {
    title: 'Dettaglio Evento - EventHub',
    page: 'event-detail'
  });
});

// ROTTE ADMIN (protette - verifica token lato client)
app.get('/admin', (req, res) => {
  res.render('admin/dashboard', {
    title: 'Admin Dashboard - EventHub',
    page: 'admin-dashboard'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('errors/404', {
    title: '404 - Pagina non trovata',
    page: '404'
  });
});

// Avvio server
const PORT = process.env.FRONTEND_PORT || 3001;
app.listen(PORT, () => {
  console.log(`🎨 Frontend server avviato su http://localhost:${PORT}`);
  console.log(`📡 Backend API: ${process.env.BACKEND_URL || 'http://localhost:3000'}`);
});

module.exports = app;