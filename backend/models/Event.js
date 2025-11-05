const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000
  },
  date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 200
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  category: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  image: {
    type: String,
    trim: true,
    default: 'https://via.placeholder.com/150' // Immagine di default
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;