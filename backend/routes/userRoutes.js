// Rotte utente
// Questo modulo definisce le rotte per le operazioni relative all'utente, come profilo, eventi, password, chat, segnalazioni, e partecipazioni.
// Include rotte per ottenere il profilo utente, aggiornare il profilo, ottenere eventi pubblici, aggiungere messaggi di chat, segnalare eventi, e partecipare agli eventi.
// Rotte utente con Chat

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { requireAnyRole } = require('../middlewares/roleMiddleware');
const userProfileController = require('../controllers/userProfileController');
const userEventController = require('../controllers/userEventController');
const userPasswordController = require('../controllers/userPasswordController');
const userChatController = require('../controllers/userChatController');
const userReportController = require('../controllers/userReportController');
const userAttendanceController = require('../controllers/userAttendanceController');

/**
 * @route   POST /api/user/forgot-password
 * @desc    Richiede il reset della password inviando un'email
 * @access  Public
 */
router.post('/forgot-password', userPasswordController.forgotPassword);

/**
 * @route   POST /api/user/reset-password/:token
 * @desc    Resetta la password con il token ricevuto via email
 * @access  Public
 */
router.post('/reset-password/:token', userPasswordController.resetPassword);

/**
 * @route   GET /api/user/public-events
 * @desc    Ottieni lista eventi pubblici con filtri
 * @access  Public
 */
router.get('/public-events', userEventController.getPublicEvents);

/**
 * @route   POST /api/user/events/:eventId/chat
 * @desc    Aggiungi messaggio alla chat evento
 * @access  Private (User/Admin)
 */
router.post('/events/:eventId/chat', authenticate, requireAnyRole('user', 'admin'), userChatController.addChatMessage);

/**
 * @route   GET /api/user/events/:eventId/chat
 * @desc    Ottieni messaggi chat evento
 * @access  Private (User/Admin)
 */
router.get('/events/:eventId/chat', authenticate, requireAnyRole('user', 'admin'), userChatController.getChatMessages);

/**
 * @route   POST /api/user/events/:eventId/report
 * @desc    Segnala evento
 * @access  Private (User/Admin)
 */
router.post('/events/:eventId/report', authenticate, requireAnyRole('user', 'admin'), userReportController.reportEvent);

// Tutte le routes richiedono autenticazione
router.use(authenticate);

/**
 * @route   GET /api/user/profile
 * @desc    Ottieni profilo utente corrente
 * @access  Private
 */
router.get('/profile', userProfileController.getProfile);

/**
 * @route   PUT /api/user/profile
 * @desc    Aggiorna profilo utente
 * @access  Private
 */
router.put('/profile', userProfileController.updateProfile);

/**
 * @route   PUT /api/user/change-password
 * @desc    Cambia password
 * @access  Private
 */
router.put('/change-password', userPasswordController.changePassword);

/**
 * @route   POST /api/user/events
 * @desc    Crea nuovo evento
 * @access  Private (Admin)
 */
router.post('/events', requireAnyRole('admin'), userEventController.createEvent);

/**
 * @route   PUT /api/user/events/:eventId
 * @desc    Aggiorna un evento esistente
 * @access  Private (Solo il proprietario dell'evento)
 */
router.put('/events/:eventId', requireAnyRole('admin'), userEventController.updateEvent);

/**
 * @route   DELETE /api/user/events/:eventId
 * @desc    Elimina un evento esistente
 * @access  Private (Solo il proprietario dell'evento)
 */
router.delete('/events/:eventId', requireAnyRole('admin'), userEventController.deleteEvent);

/**
 * @route   POST /api/user/events/:eventId/join
 * @desc    Iscriviti a evento
 * @access  Private (User/Admin)
 */
router.post('/events/:eventId/join', requireAnyRole('user', 'admin'), userAttendanceController.joinEvent);

/**
 * @route   POST /api/user/events/:eventId/leave
 * @desc    Annulla iscrizione a evento
 * @access  Private (User/Admin)
 */
router.post('/events/:eventId/leave', requireAnyRole('user', 'admin'), userAttendanceController.leaveEvent);

/**
 * @route   GET /api/user/events
 * @desc    Lista eventi utente (creati o iscritti)
 * @access  Private (User/Admin)
 */
router.get('/events', requireAnyRole('user', 'admin'), userEventController.getMyEvents);

module.exports = router;