// Questa funzione recupera tutti gli utenti presenti nel database, escludendo il campo password per sicurezza.
// Restituisce una lista ordinata per data di registrazione (dal più recente al più vecchio)
// con un massimo di 100 utenti.
// Se si verificano errori durante il recupero, viene inviato un messaggio di errore con status 500.

const User = require('../models/User');

// Lista di tutti gli utenti (per admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Errore nel recupero utenti:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero lista utenti'
    });
  }
};

const toggleUserBlock = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Non permettere di bloccare se stessi
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Non puoi bloccare te stesso'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    // Non permettere di bloccare altri admin
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non puoi bloccare un amministratore'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    const action = user.isActive ? 'sbloccato' : 'bloccato';
    res.json({
      success: true,
      message: `Utente ${action} con successo`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Errore nel blocco utente:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel blocco/sblocco utente'
    });
  }
};

// Promuovi utente a admin
const promoteToAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Sei già amministratore'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'L\'utente è già amministratore'
      });
    }

    user.role = 'admin';
    await user.save();

    res.json({
      success: true,
      message: 'Utente promosso a amministratore con successo',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Errore nella promozione admin:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella promozione a amministratore'
      });
    }
  };

// Degrada admin a user
const demoteToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Non puoi degradare te stesso'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    if (user.role === 'user') {
      return res.status(400).json({
        success: false,
        message: 'L\'utente è già un utente base'
      });
    }

    user.role = 'user';
    await user.save();

    res.json({
      success: true,
      message: 'Amministratore degradato a utente con successo',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Errore nella degradazione:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella degradazione a utente'
    });
  }
};

module.exports = {
  getAllUsers,
  toggleUserBlock,
  promoteToAdmin,
  demoteToUser
};