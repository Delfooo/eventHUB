// Routes Upload Immagini

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { uploadEventImage, handleUploadError } = require('../middlewares/uploadMiddleware');
const uploadController = require('../controllers/uploadController');

// Tutte le routes richiedono autenticazione
router.use(authenticate);

/**
 * @route   POST /api/upload/event-image
 * @desc    Upload immagine evento
 * @access  Private
 */
router.post('/event-image', uploadEventImage, handleUploadError, uploadController.uploadEventImage);

/**
 * @route   DELETE /api/upload/:filename
 * @desc    Elimina immagine
 * @access  Private
 */
router.delete('/:filename', uploadController.deleteImage);

module.exports = router;