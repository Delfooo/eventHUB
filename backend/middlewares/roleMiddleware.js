const requireRole = (role) => {
  return (req, res, next) => {
    try {
      // Verifica che l'utente sia autenticato
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Autenticazione richiesta'
        });
      }

      // Controlla se l'utente ha il ruolo richiesto
      if (req.user.role !== role) {
        return res.status(403).json({
          success: false,
          message: `Accesso negato. Richiesto ruolo: ${role}`
        });
      }

      // Utente ha il ruolo corretto, procedi
      next();
    } catch (error) {
      console.error('Errore nel controllo ruolo:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore del server nel controllo ruolo'
      });
    }
  };
};

// Helper functions per ruoli specifici
const requireAdmin = requireRole('admin');
const requireUser = requireRole('user');

// Middleware per ruoli multipli (OR logic)
const requireAnyRole = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Autenticazione richiesta'
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Accesso negato. Ruoli permessi: ${roles.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Errore nel controllo ruoli multipli:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore del server nel controllo ruolo'
      });
    }
  };
};

module.exports = {
  requireRole,
  requireAdmin,
  requireUser,
  requireAnyRole
};