// Questa funzione gestisce l'invio di messaggi in chat per un evento.
// Prende l'ID dell'evento dalla richiesta e il messaggio dal corpo della richiesta.
// Controlla se l'evento esiste e se l'utente è autorizzato a inviare messaggi (partecipante o proprietario).
// Se il messaggio è vuoto, viene inviato un messaggio di errore.
// Altrimenti, il messaggio viene aggiunto alla lista dei messaggi della chat, l'evento viene salvato e viene inviato un messaggio di conferma.
// Se si verificano errori, viene inviato un messaggio di errore con status 500.

const Event = require('../models/Event');

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