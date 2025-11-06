const Event = require('../models/Event');
const { io } = require('../socket');

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