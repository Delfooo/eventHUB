const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { requireAnyRole } = require('../middlewares/roleMiddleware');
const {
  getProfile,
  updateProfile,
  changePassword,
  createEvent,
  joinEvent,
  getMyEvents
} = require('../controllers/userController');

// Tutte le routes richiedono autenticazione (sia user che admin possono accedere)
router.use(authenticate);

/**
 * @route   GET /api/user/profile
 * @desc    Ottieni profilo utente corrente
 * @access  Private
 */
router.get('/profile', getProfile);

/**
 * @route   PUT /api/user/profile
 * @desc    Aggiorna profilo utente
 * @access  Private
 */
router.put('/profile', updateProfile);

/**
 * @route   PATCH /api/user/password
 * @desc    Cambia password
 * @access  Private
 */
router.patch('/password', changePassword);

/**
 * @route   POST /api/user/events
 * @desc    Crea nuovo evento
 * @access  Private (User/Admin)
 */
router.post('/events', requireAnyRole('user', 'admin'), createEvent);

/**
 * @route   POST /api/user/events/:eventId/join
 * @desc    Iscriviti a evento
 * @access  Private (User/Admin)
 */
router.post('/events/:eventId/join', requireAnyRole('user', 'admin'), joinEvent);

/**
 * @route   GET /api/user/events
 * @desc    Lista eventi utente (creati o iscritti)
 * @access  Private (User/Admin)
 */
router.get('/events', requireAnyRole('user', 'admin'), getMyEvents);

module.exports = router;