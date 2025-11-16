// Routes Notifiche

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const notificationController = require('../controllers/notificationController');

// Tutte le routes richiedono autenticazione
router.use(authenticate);

/**
 * @route   GET /api/notifications
 * @desc    Ottieni notifiche utente
 * @access  Private
 */
router.get('/', notificationController.getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Ottieni conteggio notifiche non lette
 * @access  Private
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @route   PATCH /api/notifications/:notificationId/read
 * @desc    Segna notifica come letta
 * @access  Private
 */
router.patch('/:notificationId/read', notificationController.markAsRead);

/**
 * @route   PATCH /api/notifications/mark-all-read
 * @desc    Segna tutte le notifiche come lette
 * @access  Private
 */
router.patch('/mark-all-read', notificationController.markAllAsRead);

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Elimina notifica
 * @access  Private
 */
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;