// Servizio per le emissioni Socket.IO
// Questo modulo fornisce funzioni per l'emissione di eventi Socket.IO.
// Include le funzioni per l'emissione di eventi relativi alla segnalazione di eventi,
// all'iscrizione e alla disiscrizione degli utenti da eventi.

const io = require('../socket');

exports.emitEventReported = (eventId, eventName, reportCount, reportedBy) => {
    io.getIO().emit('admin:eventReported', {
        eventId: eventId,
        eventName: eventName,
        reportCount: reportCount,
        reportedBy: reportedBy
    });
};

exports.emitUserJoinedEvent = (eventId, userId, username, eventTitle) => {
    io.getIO().emit('userJoinedEvent', { eventId: eventId, userId: userId, username: username, eventTitle: eventTitle });
};

exports.emitUserLeftEvent = (eventId, userId, username, eventTitle) => {
    io.getIO().emit('userLeftEvent', { eventId: eventId, userId: userId, username: username, eventTitle: eventTitle });
};