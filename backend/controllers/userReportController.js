// Controllore per la segnalazione di eventi
// Questo modulo fornisce la funzione per la segnalazione di eventi.
// Include la verifica della presenza dell'utente nella lista degli iscritti,
// l'aggiunta dell'utente alla lista dei segnalatori e l'aggiornamento del conteggio delle segnalazioni.

const Event = require('../models/Event');
const realTimeService = require('../services/realTimeService');

const reportEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento non trovato' });
    }

    // Impedisci a un utente di segnalare lo stesso evento più volte
    if (event.reportedBy.includes(userId)) {
      return res.status(400).json({ success: false, message: 'Hai già segnalato questo evento' });
    }

    event.reportedBy.push(userId);
    event.reportCount += 1;

    // Se l'evento raggiunge una certa soglia di segnalazioni, potresti volerlo marcare per revisione
    if (event.reportCount >= 5 && !event.isReported) { // Esempio: 5 segnalazioni
      event.isReported = true;
      // Notifica gli amministratori o il sistema per la revisione
      realTimeService.emitEventReported(event._id, event.name, event.reportCount, userId);
    }

    await event.save();

    res.json({ success: true, message: 'Evento segnalato con successo', reportCount: event.reportCount });
  } catch (error) {
    console.error('Errore nella segnalazione evento:', error);
    res.status(500).json({ success: false, message: 'Errore nella segnalazione evento' });
  }
};

module.exports = {
  reportEvent
};