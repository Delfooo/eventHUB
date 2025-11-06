// Rotte di autenticazione
// Questo modulo definisce le rotte per l'autenticazione degli utenti.
// Include rotte per registrazione, login, logout, e verifica token.

const express = require('express');
const { register, login, logout } = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// Rotte pubbliche
router.post('/register', register);
router.post('/login', login);

// Rotte protette
router.post('/logout', authenticate, logout);

// Rotta per verificare token (utile per frontend)
router.get('/verify', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Token valido',
    data: {
      user: req.user
    }
  });
});

// Rotta per ottenere info utente corrente
router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

module.exports = router;