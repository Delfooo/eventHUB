// Questa funzione gestisce la registrazione di nuovi utenti.
// Prende i campi username, email e password dal corpo della richiesta.
// Valida l'input, controllando se tutti i campi sono presenti e se la password è sufficientemente lunga.
// Controlla se l'email o l'username sono già registrati in precedenza.
// Se tutto è valido, crea un nuovo utente, salva il password hashato e genera un token JWT.
// Restituisce l'utente registrato e il token in formato JSON con status 201.
// Se si verificano errori, viene inviato un messaggio di errore con status 500.



const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Registrazione nuovo utente
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validazione input
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
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: existingUser.email === email 
          ? 'Email già registrata' 
          : 'Username già in uso'
      });
    }

    // Crea nuovo utente
    const newUser = new User({
      username,
      email,
      password
    });

    await newUser.save();

    // Genera token JWT
    const token = jwt.sign(
      { 
        userId: newUser._id,
        username: newUser.username,
        role: newUser.role 
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Utente registrato con successo',
      data: {
        user: newUser,
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
};

// Login utente
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validazione input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email e password sono richieste' 
      });
    }

    // Trova utente per email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenziali non valide' 
      });
    }

    // Controlla se utente è attivo
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account disabilitato' 
      });
    }

    // Confronta password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenziali non valide' 
      });
    }

    // Aggiorna ultimo login
    user.lastLogin = new Date();
    await user.save();

    // Genera token JWT
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login effettuato con successo',
      data: {
        user,
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
};

// Logout utente (invalida token lato client)
const logout = async (req, res) => {
  try {
    // In un'implementazione reale, potresti aggiungere il token a una blacklist
    // Per ora, il logout viene gestito lato client rimuovendo il token
    res.status(200).json({
      success: true,
      message: 'Logout effettuato con successo'
    });
  } catch (error) {
    console.error('Errore logout:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore durante il logout',
      error: error.message 
    });
  }
};

module.exports = {
  register,
  login,
  logout
};