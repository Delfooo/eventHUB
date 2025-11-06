// Servizio per l'invio di email
// Questo modulo fornisce una funzione per l'invio di email utilizzando Nodemailer.
// Include la configurazione del trasportatore per l'invio di email tramite il servizio Gmail.
// La funzione sendEmail accetta le opzioni per l'email e restituisce una promessa che si risolve se l'email è inviata con successo.

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendEmail = async (mailOptions) => {
    try {
        await transporter.sendMail(mailOptions);
        console.log('Email inviata con successo.');
        return true;
    } catch (error) {
        console.error('Errore durante l\'invio dell\'email:', error);
        return false;
    }
};