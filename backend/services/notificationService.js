// Service Notifiche con Socket.io

const Notification = require('../models/Notification');

let io = null;

const setSocketIO = (socketIO) => {
  io = socketIO;
};

const sendNotification = async (notificationData) => {
  try {
    const notification = await Notification.createNotification(notificationData);

    if (io) {
      io.to(`user-${notificationData.recipient}`).emit('notification', {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        icon: notification.icon,
        link: notification.link,
        relatedUser: notification.relatedUser,
        createdAt: notification.createdAt,
        read: false
      });
    }

    return notification;
  } catch (error) {
    console.error('Errore invio notifica:', error);
    throw error;
  }
};

const notifyEventJoin = async (event, joiningUser) => {
  try {
    // Notifica all'organizzatore
    if (event.owner.toString() !== joiningUser._id.toString()) {
      await sendNotification({
        recipient: event.owner,
        type: 'event_join',
        title: 'Nuovo Partecipante',
        message: `${joiningUser.username} si è iscritto a "${event.title}"`,
        relatedEvent: event._id,
        relatedUser: joiningUser._id,
        link: `/event/${event._id}`,
        icon: 'user-plus'
      });
    }
  } catch (error) {
    console.error('Errore notifica event join:', error);
  }
};

const notifyEventLeave = async (event, leavingUser) => {
  try {
    // Notifica all'organizzatore
    if (event.owner.toString() !== leavingUser._id.toString()) {
      await sendNotification({
        recipient: event.owner,
        type: 'event_leave',
        title: 'Partecipante Rimosso',
        message: `${leavingUser.username} ha annullato l'iscrizione a "${event.title}"`,
        relatedEvent: event._id,
        relatedUser: leavingUser._id,
        link: `/event/${event._id}`,
        icon: 'user-minus'
      });
    }
  } catch (error) {
    console.error('Errore notifica event leave:', error);
  }
};

const notifyEventUpdate = async (event, updatedBy) => {
  try {
    const attendees = event.attendees.filter(
      attendee => attendee.toString() !== updatedBy.toString()
    );

    const notifications = attendees.map(attendeeId => ({
      recipient: attendeeId,
      type: 'event_update',
      title: 'Evento Aggiornato',
      message: `L'evento "${event.title}" è stato modificato`,
      relatedEvent: event._id,
      link: `/event/${event._id}`,
      icon: 'edit'
    }));

    await Promise.all(notifications.map(notif => sendNotification(notif)));
  } catch (error) {
    console.error('Errore notifica event update:', error);
  }
};

const notifyEventDelete = async (event, deletedBy) => {
  try {
    // Notifica a tutti i partecipanti
    const attendees = event.attendees.filter(
      attendee => attendee.toString() !== deletedBy.toString()
    );

    const notifications = attendees.map(attendeeId => ({
      recipient: attendeeId,
      type: 'event_delete',
      title: 'Evento Cancellato',
      message: `L'evento "${event.title}" è stato cancellato`,
      icon: 'trash',
      link: '/dashboard'
    }));

    await Promise.all(notifications.map(notif => sendNotification(notif)));
  } catch (error) {
    console.error('Errore notifica event delete:', error);
  }
};

const notifyChatMessage = async (event, sender, excludeUserId) => {
  try {
    // Notifica a tutti i partecipanti (escluso il sender)
    const recipients = [event.owner, ...event.attendees].filter(
      userId => userId.toString() !== excludeUserId.toString()
    );

    const notifications = recipients.map(recipientId => ({
      recipient: recipientId,
      type: 'chat_message',
      title: 'Nuovo Messaggio',
      message: `${sender.username} ha scritto in "${event.title}"`,
      relatedEvent: event._id,
      relatedUser: sender._id,
      link: `/event/${event._id}#chat`,
      icon: 'comment'
    }));

    await Promise.all(notifications.map(notif => sendNotification(notif)));
  } catch (error) {
    console.error('Errore notifica chat message:', error);
  }
};

const notifyEventReminder = async (event) => {
  try {
    const recipients = [event.owner, ...event.attendees];

    const notifications = recipients.map(recipientId => ({
      recipient: recipientId,
      type: 'event_reminder',
      title: 'Promemoria Evento',
      message: `L'evento "${event.title}" inizia tra 24 ore!`,
      relatedEvent: event._id,
      link: `/event/${event._id}`,
      icon: 'clock'
    }));

    await Promise.all(notifications.map(notif => sendNotification(notif)));
  } catch (error) {
    console.error('Errore notifica reminder:', error);
  }
};

const notifyAdminAction = async (userId, actionType, message) => {
  try {
    await sendNotification({
      recipient: userId,
      type: 'admin_action',
      title: 'Azione Amministratore',
      message: message,
      icon: 'shield-alt',
      link: '/profile'
    });
  } catch (error) {
    console.error('Errore notifica admin action:', error);
  }
};

module.exports = {
  setSocketIO,
  sendNotification,
  notifyEventJoin,
  notifyEventLeave,
  notifyEventUpdate,
  notifyEventDelete,
  notifyChatMessage,
  notifyEventReminder,
  notifyAdminAction
};