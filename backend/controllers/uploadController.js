// Controller Upload Immagini

const path = require('path');
const fs = require('fs');

exports.uploadEventImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nessun file caricato'
      });
    }

    const imageUrl = `/uploads/events/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Immagine caricata con successo',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Errore upload immagine:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel caricamento dell\'immagine'
    });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Nome file mancante'
      });
    }

    const filePath = path.join(__dirname, '../uploads/events', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File non trovato'
      });
    }

    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      message: 'Immagine eliminata con successo'
    });
  } catch (error) {
    console.error('Errore eliminazione immagine:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'eliminazione dell\'immagine'
    });
  }
};