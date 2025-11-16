// Modello Notifica
// Schema per le notifiche utente

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['event_join', 'event_leave', 'event_update', 'event_delete', 'chat_message', 'event_reminder', 'admin_action', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  relatedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  link: {
    type: String,
    maxlength: 200
  },
  icon: {
    type: String,
    default: 'bell'
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  return notification.populate('relatedUser', 'username');
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;