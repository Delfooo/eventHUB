const User = require('../models/User');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { jwtSecret } = require('../config/configJWT');

// 1. Configura Nodemailer (usa variabili d'ambiente per credenziali!)
const transporter = nodemailer.createTransport({
    service: 'Gmail', // Oppure 'SendGrid', 'Mailgun', ecc.
    auth: {
        user: process.env.EMAIL_USER,    // Tua email
        pass: process.env.EMAIL_PASS     // Password per le app/Token
    }
});

// Cambia password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password corrente e nuova password sono richieste'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nuova password deve essere di almeno 6 caratteri'
      });
    }

    const user = await User.findById(req.user._id);
    
    // Verifica password corrente
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password corrente errata'
      });
    }

    // Aggiorna password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password cambiata con successo'
    });
  } catch (error) {
    console.error('Errore nel cambio password:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel cambio password'
    });
  }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ message: 'Se l email esiste, riceverai un link per il reset.' });
        }

        const resetToken = jwt.sign(
            { id: user._id },
            jwtSecret,
            { expiresIn: '1h' }
        );

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        const resetURL = `${process.env.CLIENT_BASE_URL}/reset-password/${resetToken}`;

        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL_USER,
            subject: 'Reset Password',
            html: `<p>Hai richiesto un reset della password.</p>\n                   <p>Clicca su questo link per procedere: <a href=\"${resetURL}\">Reset Password</a></p>\n                   <p>Questo link è valido solo per un\'ora.</p>`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Email di reset inviata con successo.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Errore durante l invio dell email.' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Token non valido o scaduto.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();
        
        res.status(200).json({ message: 'Password aggiornata con successo. Puoi effettuare il login.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Errore durante il reset della password.' });
    }
};