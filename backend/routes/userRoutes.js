const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { requireAnyRole } = require('../middlewares/roleMiddleware');
const { getProfile, reportEvent, updateProfile, changePassword, createEvent, joinEvent, leaveEvent, updateEvent, deleteEvent, getMyEvents, getPublicEvents, addChatMessage, getChatMessages } = require('../controllers/userController');

/**
 * @route   GET /api/user/public-events
 * @desc    Ottieni lista eventi pubblici con filtri
 * @access  Public
 */
router.post('/events/:eventId/chat', authenticate, requireAnyRole('user', 'admin'), addChatMessage);
router.post('/events/:eventId/report', authenticate, requireAnyRole('user', 'admin'), reportEvent);
router.get('/public-events', getPublicEvents);

// Tutte le routes richiedono autenticazione (sia user che admin possono accedere)
router.use(authenticate);

/**
 * @route   GET /api/user/profile
 * @desc    Ottieni profilo utente corrente
 * @access  Private
 */
router.get('/profile', authenticate, getProfile);

/**
 * @route   PUT /api/user/profile
 * @desc    Aggiorna profilo utente
 * @access  Private
 */
router.put('/profile', authenticate, updateProfile);

/**
 * @route   PATCH /api/user/password
 * @desc    Cambia password
 * @access  Private
 */
router.put('/change-password', authenticate, changePassword);

/**
 * @route   POST /api/user/events
 * @desc    Crea nuovo evento
 * @access  Private (User/Admin)
 */
router.post('/events', authenticate, requireAnyRole('admin'), createEvent);

/**
 * @route   PUT /api/user/events/:eventId
 * @desc    Aggiorna un evento esistente
 * @access  Private (Solo il proprietario dell'evento)
 */
router.put('/events/:eventId', authenticate, requireAnyRole('admin'), updateEvent);

/**
 * @route   DELETE /api/user/events/:eventId
 * @desc    Elimina un evento esistente
 * @access  Private (Solo il proprietario dell'evento)
 */
router.delete('/events/:eventId', authenticate, requireAnyRole('admin'), deleteEvent);

/**
 * @route   POST /api/user/events/:eventId/join
 * @desc    Iscriviti a evento
 * @access  Private (User/Admin)
 */
router.post('/events/:eventId/join', authenticate, requireAnyRole('user', 'admin'), joinEvent);
/**
 * @route   POST /api/user/events/:eventId/leave
 * @desc    Annulla iscrizione a evento
 * @access  Private (User/Admin)
 */
router.post('/events/:eventId/leave', requireAnyRole('user', 'admin'), leaveEvent);

/**
 * @route   GET /api/user/events
 * @desc    Lista eventi utente (creati o iscritti)
 * @access  Private (User/Admin)
 */
router.get('/events', requireAnyRole('user', 'admin'), getMyEvents);

module.exports = router;