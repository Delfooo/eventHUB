// Controllore per l'iscrizione e la disiscrizione da eventi
// Questo modulo fornisce le funzioni per l'iscrizione e la disiscrizione degli utenti da eventi.
// Include le funzioni per aggiungere e rimuovere gli utenti dalla lista degli iscritti di un evento.

const Event = require('../models/Event');
const realTimeService = require('../services/realTimeService');

const joinEvent = async (req, res) => {
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

    realTimeService.emitUserJoinedEvent(event._id, userId, req.user.username, event.title);

    res.status(200).json({ success: true, message: 'Iscrizione all evento avvenuta con successo' });
  } catch (error) {
    console.error('Errore nell iscrizione all evento:', error);
    res.status(500).json({ success: false, message: 'Errore nell iscrizione all evento', error: error.message });
  }
};

const leaveEvent = async (req, res) => {
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

    realTimeService.emitUserLeftEvent(event._id, userId, req.user.username, event.title);

    res.status(200).json({ success: true, message: 'Disiscrizione dall evento avvenuta con successo' });
  } catch (error) {
    console.error('Errore nella disiscrizione dall evento:', error);
    res.status(500).json({ success: false, message: 'Errore nella disiscrizione dall evento', error: error.message });
  }
};

module.exports = {
  joinEvent,
  leaveEvent
};