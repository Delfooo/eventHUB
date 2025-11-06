// Rotte amministrative
// Questo modulo definisce le rotte per la gestione amministrativa degli utenti e delle statistiche.
// Include rotte per ottenere tutti gli utenti, bloccare/sbloccare utenti, promuovere/demuovere amministratori, e ottenere statistiche amministrative.

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');
const {
  getAllUsers,
  toggleUserBlock,
  promoteToAdmin,
  demoteToUser
} = require('../controllers/adminUserManagement');
const {
  getAdminStats
} = require('../controllers/adminStatsController');

// Tutte le routes richiedono autenticazione e ruolo admin
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/users
 * @desc    Lista di tutti gli utenti
 * @access  Private (Admin)
 */
router.get('/users', getAllUsers);

/**
 * @route   PATCH /api/admin/users/:userId/block
 * @desc    Blocca/Sblocca utente
 * @access  Private (Admin)
 */
router.patch('/users/:userId/block', toggleUserBlock);

/**
 * @route   PATCH /api/admin/users/:userId/promote
 * @desc    Promuovi utente a admin
 * @access  Private (Admin)
 */
router.patch('/users/:userId/promote', promoteToAdmin);

/**
 * @route   PATCH /api/admin/users/:userId/demote
 * @desc    Degrada admin a user
 * @access  Private (Admin)
 */
router.patch('/users/:userId/demote', demoteToUser);

/**
 * @route   GET /api/admin/stats
 * @desc    Statistiche amministratore
 * @access  Private (Admin)
 */
router.get('/stats', getAdminStats);

module.exports = router;