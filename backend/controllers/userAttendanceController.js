// Controllore per l'iscrizione e la disiscrizione da eventi
// Questo modulo fornisce le funzioni per l'iscrizione e la disiscrizione degli utenti da eventi.
// Include le funzioni per aggiungere e rimuovere gli utenti dalla lista degli iscritti di un evento.

const Event = require('../models/Event');
const notificationService = require('../services/notificationService');

const joinEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId).populate('owner', 'username');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento non trovato' });
    }

    if (event.attendees.includes(userId)) {
      return res.status(400).json({ success: false, message: 'Sei già iscritto a questo evento' });
    }

    if (event.attendees.length >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Capienza massima raggiunta per questo evento' });
    }

    event.attendees.push(userId);
    await event.save();

    await notificationService.notifyEventJoin(event, req.user);

    res.status(200).json({ 
      success: true, 
      message: 'Iscrizione all\'evento avvenuta con successo' 
    });
  } catch (error) {
    console.error('Errore nell\'iscrizione all\'evento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nell\'iscrizione all\'evento', 
      error: error.message 
    });
  }
};

const leaveEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId).populate('owner', 'username');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento non trovato' });
    }

    if (!event.attendees.includes(userId)) {
      return res.status(400).json({ success: false, message: 'Non sei iscritto a questo evento' });
    }

    event.attendees = event.attendees.filter(attendee => attendee.toString() !== userId.toString());
    await event.save();

    await notificationService.notifyEventLeave(event, req.user);

    res.status(200).json({ 
      success: true, 
      message: 'Disiscrizione dall\'evento avvenuta con successo' 
    });
  } catch (error) {
    console.error('Errore nella disiscrizione dall\'evento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nella disiscrizione dall\'evento', 
      error: error.message 
    });
  }
};

module.exports = {
  joinEvent,
  leaveEvent
};