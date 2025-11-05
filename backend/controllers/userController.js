const User = require('../models/User');
const Event = require('../models/Event');
const { io } = require('../socket');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 1. Configura Nodemailer (usa variabili d'ambiente per credenziali!)
const transporter = nodemailer.createTransport({
    service: 'Gmail', // Oppure 'SendGrid', 'Mailgun', ecc.
    auth: {
        user: process.env.EMAIL_USER,    // Tua email
        pass: process.env.EMAIL_PASS     // Password per le app/Token
    }
});

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

exports.reportEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento non trovato' });
    }

    event.reportCount += 1;
    if (event.reportCount >= 3) { // Soglia per considerare l'evento segnalato
      event.reported = true;
    }

    await event.save();

    if (event.reported) {
      io.emit('reportedEvent', { eventId: event._id, message: `L'evento ${event.title} è stato segnalato!` });
    }

    res.status(200).json({ success: true, message: 'Evento segnalato con successo', event });
  } catch (error) {
    console.error('Errore nella segnalazione dell evento:', error);
    res.status(500).json({ success: false, message: 'Errore nella segnalazione dell evento', error: error.message });
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

// Cambia password
exports.changePassword = async (req, res) => {
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
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, location, capacity, image, category } = req.body;

    // Validazione input
    if (!title || !description || !date || !location || !capacity || !category) {
      return res.status(400).json({
        success: false,
        message: 'Tutti i campi obbligatori (titolo, descrizione, data, luogo, capienza, categoria) sono richiesti'
      });
    }

    // Crea nuovo evento
    const newEvent = new Event({
      title,
      description,
      date,
      location,
      capacity,
      image,
      category,
      owner: req.user._id // L ID dell utente autenticato e l owner dell evento
    });

    await newEvent.save();

    res.status(201).json({
      success: true,
      message: 'Evento creato con successo!',
      event: newEvent
    });
  } catch (error) {
    console.error('Errore nella creazione evento:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione dell\'evento',
      error: error.message
    });
  }
};

// Iscriviti a evento (placeholder - da implementare)
exports.joinEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento non trovato' });
    }

    // Controlla se l utente e gia iscritto
    if (event.attendees.includes(userId)) {
      return res.status(400).json({ success: false, message: 'Sei gia iscritto a questo evento' });
    }

    // Controlla la capienza
    if (event.attendees.length >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Capienza massima raggiunta per questo evento' });
    }

    event.attendees.push(userId);
    await event.save();

    io.emit('userJoinedEvent', { eventId: event._id, userId: userId, username: req.user.username, eventTitle: event.title });

    res.status(200).json({ success: true, message: 'Iscrizione all evento avvenuta con successo' });
  } catch (error) {
    console.error('Errore nell iscrizione all evento:', error);
    res.status(500).json({ success: false, message: 'Errore nell iscrizione all evento', error: error.message });
  }
};

exports.leaveEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento non trovato' });
    }

    // Controlla se l utente non e iscritto
    if (!event.attendees.includes(userId)) {
      return res.status(400).json({ success: false, message: 'Non sei iscritto a questo evento' });
    }

    event.attendees = event.attendees.filter(attendee => attendee.toString() !== userId.toString());
    await event.save();

    io.emit('userLeftEvent', { eventId: event._id, userId: userId, username: req.user.username, eventTitle: event.title });

    res.status(200).json({ success: true, message: 'Disiscrizione dall evento avvenuta con successo' });
  } catch (error) {
    console.error('Errore nella disiscrizione dall evento:', error);
    res.status(500).json({ success: false, message: 'Errore nella disiscrizione dall evento', error: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, description, date, location, capacity, image, category } = req.body;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento non trovato' });
    }

    // Verifica se l utente autenticato e il proprietario dell evento
    if (event.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Non autorizzato a modificare questo evento' });
    }

    // Aggiorna i campi dell evento
    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.location = location || event.location;
    event.capacity = capacity || event.capacity;
    event.image = image || event.image;
    event.category = category || event.category;

    await event.save();

    res.status(200).json({ success: true, message: 'Evento aggiornato con successo', event });
  } catch (error) {
    console.error('Errore nell aggiornamento evento:', error);
    res.status(500).json({ success: false, message: 'Errore nell aggiornamento dell evento', error: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento non trovato' });
    }

    // Verifica se l utente autenticato e il proprietario dell evento
    if (event.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Non autorizzato a eliminare questo evento' });
    }

    await event.deleteOne();

    res.status(200).json({ success: true, message: 'Evento eliminato con successo' });
  } catch (error) {
    console.error('Errore nell eliminazione evento:', error);
    res.status(500).json({ success: false, message: 'Errore nell eliminazione dell evento', error: error.message }); 
  }
};

exports.getMyEvents = async (req, res) => {
  try {
    const userId = req.user._id;

    const events = await Event.find({
      $or: [
        { owner: userId }, // Eventi creati dall utente
        { attendees: userId } // Eventi a cui l utente e iscritto
      ]
    }).populate('owner', 'username email').populate('attendees', 'username email');

    res.status(200).json({ success: true, events });
  } catch (error) {
    console.error('Errore nel recupero degli eventi dell utente:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero degli eventi dell utente', error: error.message });
  }
};

exports.getPublicEvents = async (req, res) => {
  try {
    const { date, category, location } = req.query;
    let filter = {};

    if (date) {
      // Filtra per data (es. eventi a partire da una certa data)
      filter.date = { $gte: new Date(date) };
    }
    if (category) {
      filter.category = new RegExp(category, 'i'); // Ricerca case-insensitive
    }
    if (location) {
      filter.location = new RegExp(location, 'i'); // Ricerca case-insensitive
    }

    const events = await Event.find(filter)
      .populate('owner', 'username email')
      .populate('attendees', 'username email')
      .sort('date'); // Ordina per data

    res.status(200).json({ success: true, events });
  } catch (error) {
    console.error('Errore nel recupero degli eventi pubblici:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero degli eventi pubblici.', error: error.message });
  }
};

exports.addChatMessage = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Il messaggio non puo essere vuoto' });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento non trovato' });
    }

    // Verifica se l utente e un partecipante dell evento o il proprietario
    if (event.owner.toString() !== userId.toString() && !event.attendees.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Non autorizzato a inviare messaggi in questa chat' });
    }

    event.chatMessages.push({ sender: userId, message });
    await event.save();

    res.status(201).json({ success: true, message: 'Messaggio inviato con successo', chatMessage: event.chatMessages[event.chatMessages.length - 1] });
  } catch (error) {
    console.error('Errore nell invio del messaggio in chat:', error);
    res.status(500).json({ success: false, message: 'Errore nell invio del messaggio in chat', error: error.message });
  }
};

exports.getChatMessages = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId).populate('chatMessages.sender', 'username');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento non trovato' });
    }

    // Verifica se l utente e un partecipante dell evento o il proprietario
    if (event.owner.toString() !== userId.toString() && !event.attendees.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Non autorizzato a visualizzare questa chat' });
    }

    res.status(200).json({ success: true, chatMessages: event.chatMessages });
  } catch (error) {
    console.error('Errore nel recupero dei messaggi della chat:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero dei messaggi della chat', error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ message: 'Se l email esiste, riceverai un link per il reset.' });
        }

        const resetToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        const resetURL = `${process.env.CLIENT_BASE_URL}/reset-password/${resetToken}`;

        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL_USER,
            subject: 'Reset Password',
            html: `<p>Hai richiesto un reset della password.</p>
                   <p>Clicca su questo link per procedere: <a href="${resetURL}">Reset Password</a></p>
                   <p>Questo link è valido solo per un'ora.</p>`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Email di reset inviata con successo.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Errore durante l invio dell email.' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Token non valido o scaduto.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();
        
        res.status(200).json({ message: 'Password aggiornata con successo. Puoi effettuare il login.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Errore durante il reset della password.' });
    }
};

exports.reportEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento non trovato' });
    }

    event.reportCount += 1;
    if (event.reportCount >= 3) { // Soglia per considerare l'evento segnalato
      event.reported = true;
    }

    await event.save();

    if (event.reported) {
      io.emit('reportedEvent', { eventId: event._id, message: `L'evento ${event.title} è stato segnalato!` });
    }

    res.status(200).json({ success: true, message: 'Evento segnalato con successo', event });
  } catch (error) {
    console.error('Errore nella segnalazione dell evento:', error);
    res.status(500).json({ success: false, message: 'Errore nella segnalazione dell evento', error: error.message });
  }
};