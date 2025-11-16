// Controller Notifiche

const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20, unreadOnly = false } = req.query;

    const query = { recipient: userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .populate('relatedUser', 'username')
      .populate('relatedEvent', 'title')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      read: false 
    });

    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Errore nel recupero notifiche:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle notifiche'
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notifica non trovata'
      });
    }

    notification.read = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notifica segnata come letta'
    });
  } catch (error) {
    console.error('Errore aggiornamento notifica:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento della notifica'
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: 'Tutte le notifiche sono state segnate come lette'
    });
  } catch (error) {
    console.error('Errore aggiornamento notifiche:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento delle notifiche'
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notifica non trovata'
      });
    }

    res.json({
      success: true,
      message: 'Notifica eliminata'
    });
  } catch (error) {
    console.error('Errore eliminazione notifica:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'eliminazione della notifica'
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false
    });

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Errore conteggio notifiche:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel conteggio delle notifiche'
    });
  }
};