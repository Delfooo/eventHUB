// Questa funzione gestisce l'autenticazione tramite JWT.
// Prende il token dall'header Authorization.
// Controlla se il token è fornito e ha il formato corretto.
// Se il token non è fornito o ha un formato errato, viene inviato un messaggio di errore.
// Altrimenti, il token viene verificato e decodificato.
// Se il token è valido, viene cercato l'utente corrispondente nell'elenco utenti.
// Se l'utente non esiste o è disabilitato, viene inviato un messaggio di errore.
// Altrimenti, l'utente viene aggiunto alla richiesta (req.user) e il controllo passa al prossimo middleware.
// Se si verificano errori, viene inviato un messaggio di errore con status 500.

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware per autenticare JWT
const authenticate = async (req, res, next) => {
  try {
    // Estrai token dall'header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token non fornito o formato non valido' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verifica token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');

    // Trova utente
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utente non trovato' 
      });
    }

    // Controlla se utente è attivo
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account disabilitato' 
      });
    }

    // Aggiungi user alla request
    req.user = user;
    next();

  } catch (error) {
    console.error('Errore autenticazione:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token non valido' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token scaduto' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Errore durante l\'autenticazione' 
    });
  }
};

// Middleware opzionale - non blocca se non c'è token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Se c'è un errore, continua senza autenticazione
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth,
};