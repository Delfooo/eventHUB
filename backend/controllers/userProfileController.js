// Questa funzione gestisce il recupero del profilo di un utente.
// Prende l'ID dell'utente dal token JWT.
// Controlla se l'utente esiste.
// Se l'utente non esiste, viene inviato un messaggio di errore.
// Altrimenti, viene inviato il profilo utente senza la password.
// Se si verificano errori, viene inviato un messaggio di errore con status 500.

const User = require('../models/User');

// Ottieni profilo utente corrente
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id, '-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Errore nel recupero profilo:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del profilo'
    });
  }
};

// Aggiorna profilo utente
exports.updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    
    // Validazione input
    if (!username && !email) {
      return res.status(400).json({
        success: false,
        message: 'Fornisci almeno un campo da aggiornare'
      });
    }

    // Controlla se username/email sono gia in uso
    const updates = {};
    if (username) {
      const existingUsername = await User.findOne({ 
        username, 
        _id: { $ne: req.user._id } 
      });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username gia in uso'
        });
      }
      updates.username = username.trim();
    }

    if (email) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Email non valida'
        });
      }
      const existingEmail = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: req.user._id } 
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email gia in uso'
        });
      }
      updates.email = email.toLowerCase().trim();
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profilo aggiornato con successo',
      user: updatedUser
    });
  } catch (error) {
    console.error('Errore nell aggiornamento profilo:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell aggiornamento del profilo'
    });
  }
};