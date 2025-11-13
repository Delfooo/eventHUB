// Questa funzione gestisce l'invio di messaggi in chat per un evento.
// Prende l'ID dell'evento dalla richiesta e il messaggio dal corpo della richiesta.
// Controlla se l'evento esiste e se l'utente è autorizzato a inviare messaggi (partecipante o proprietario).
// Se il messaggio è vuoto, viene inviato un messaggio di errore.
// Altrimenti, il messaggio viene aggiunto alla lista dei messaggi della chat, l'evento viene salvato e viene inviato un messaggio di conferma.
// Se si verificano errori, viene inviato un messaggio di errore con status 500.
// Controller Chat con Socket.io Real-Time

const Event = require('../models/Event');

// Ottieni istanza Socket.io
let io = null;

const setSocketIO = (socketIO) => {
  io = socketIO;
};

// Aggiungi messaggio chat
exports.addChatMessage = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Il messaggio non può essere vuoto' 
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Evento non trovato' 
      });
    }

    // Verifica se l'utente è un partecipante dell'evento o il proprietario
    const isOwner = event.owner.toString() === userId.toString();
    const isAttendee = event.attendees.some(attendee => attendee.toString() === userId.toString());
    
    if (!isOwner && !isAttendee) {
      return res.status(403).json({ 
        success: false, 
        message: 'Non autorizzato a inviare messaggi in questa chat' 
      });
    }

    // Crea il messaggio
    const chatMessage = {
      sender: userId,
      message: message.trim(),
      timestamp: new Date()
    };

    event.chatMessages.push(chatMessage);
    await event.save();

    // Popola il sender per la risposta
    await event.populate({
      path: 'chatMessages.sender',
      select: 'username email'
    });

    const newMessage = event.chatMessages[event.chatMessages.length - 1];

    // Emetti messaggio via Socket.io a tutti nella room
    if (io) {
      io.to(`event-${eventId}`).emit('newMessage', {
        _id: newMessage._id,
        sender: {
          _id: newMessage.sender._id,
          username: newMessage.sender.username
        },
        message: newMessage.message,
        timestamp: newMessage.timestamp
      });
    }

    res.status(201).json({ 
      success: true, 
      message: 'Messaggio inviato con successo', 
      chatMessage: newMessage 
    });
  } catch (error) {
    console.error('Errore nell\'invio del messaggio in chat:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nell\'invio del messaggio in chat', 
      error: error.message 
    });
  }
};

// Ottieni messaggi chat
exports.getChatMessages = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId).populate('chatMessages.sender', 'username email');

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Evento non trovato' 
      });
    }

    // Verifica se l'utente è un partecipante dell'evento o il proprietario
    const isOwner = event.owner.toString() === userId.toString();
    const isAttendee = event.attendees.some(attendee => attendee.toString() === userId.toString());
    
    if (!isOwner && !isAttendee) {
      return res.status(403).json({ 
        success: false, 
        message: 'Non autorizzato a visualizzare questa chat' 
      });
    }

    res.status(200).json({ 
      success: true, 
      chatMessages: event.chatMessages 
    });
  } catch (error) {
    console.error('Errore nel recupero dei messaggi della chat:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel recupero dei messaggi della chat', 
      error: error.message 
    });
  }
};

module.exports = {
  addChatMessage: exports.addChatMessage,
  getChatMessages: exports.getChatMessages,
  setSocketIO
};