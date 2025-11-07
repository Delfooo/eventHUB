// Server Frontend EventHub
// Questo server gestisce il rendering delle pagine e funge da interfaccia tra il client e il backend API

const express = require('express');
const path = require('path');
const app = express();

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

// ROTTE ADMIN (protette - verifica token lato client)
app.get('/admin', (req, res) => {
  res.render('admin/dashboard', {
    title: 'Admin Dashboard - EventHub',
    page: 'admin-dashboard'
  });
});

app.get('/admin/users', (req, res) => {
  res.render('admin/users', {
    title: 'Gestione Utenti - EventHub',
    page: 'admin-users'
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