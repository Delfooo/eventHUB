const User = require('../models/User');

// Ottieni profilo utente corrente
const getProfile = async (req, res) => {
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
const updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    
    // Validazione input
    if (!username && !email) {
      return res.status(400).json({
        success: false,
        message: 'Fornisci almeno un campo da aggiornare'
      });
    }

    // Controlla se username/email sono già in uso
    const updates = {};
    if (username) {
      const existingUsername = await User.findOne({ 
        username, 
        _id: { $ne: req.user._id } 
      });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username già in uso'
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
          message: 'Email già in uso'
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
    console.error('Errore nell\'aggiornamento profilo:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento del profilo'
    });
  }
};

// Cambia password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password corrente e nuova password sono richieste'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nuova password deve essere di almeno 6 caratteri'
      });
    }

    const user = await User.findById(req.user._id);
    
    // Verifica password corrente
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password corrente errata'
      });
    }

    // Aggiorna password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password cambiata con successo'
    });
  } catch (error) {
    console.error('Errore nel cambio password:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel cambio password'
    });
  }
};

// Crea evento (placeholder - da implementare con modello Event)
const createEvent = async (req, res) => {
  try {
    // Placeholder per creazione evento
    // Quando avrai il modello Event, implementerai qui la logica
    
    res.status(501).json({
      success: false,
      message: 'Funzionalità creazione evento in arrivo...'
    });
  } catch (error) {
    console.error('Errore nella creazione evento:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione dell\'evento'
    });
  }
};

// Iscriviti a evento (placeholder - da implementare)
const joinEvent = async (req, res) => {
  try {
    // Placeholder per iscrizione evento
    
    res.status(501).json({
      success: false,
      message: 'Funzionalità iscrizione evento in arrivo...'
    });
  } catch (error) {
    console.error('Errore nell\'iscrizione evento:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'iscrizione all\'evento'
    });
  }
};

// Ottieni eventi a cui l'utente è iscritto (placeholder)
const getMyEvents = async (req, res) => {
  try {
    // Placeholder per lista eventi utente
    
    res.status(501).json({
      success: false,
      message: 'Funzionalità lista eventi in arrivo...'
    });
  } catch (error) {
    console.error('Errore nel recupero eventi:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero degli eventi'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  createEvent,
  joinEvent,
  getMyEvents
};