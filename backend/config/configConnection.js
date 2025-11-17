/* Configurazione Database */
 
const mongoose = require('mongoose');

const conn = {
  // Configurazione Database
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/nome_del_tuo_database', 

  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Rate limiting
  rateLimitWindow: 15 * 60 * 1000, // 15 minuti
  rateLimitMax: 100, // 100 richieste per finestra

  // Upload
  maxFileSize: 5 * 1024 * 1024, // 5MB

  // Log
  logLevel: process.env.LOG_LEVEL || 'info'
};

module.exports = conn;