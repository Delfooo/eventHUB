// configDB.js
const mongoose = require('mongoose');
const config = require('./connection'); 

/**
 * Funzione per stabilire la connessione al database MongoDB.
 */
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(config.mongoUri, { 

      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Usa 'connectionInstance' per accedere all'host della connessione
    console.log(`✅ MongoDB connesso con successo su host: **${connectionInstance.connection.host}**`);
  } catch (error) {
    // Connessione fallita
    console.error(`❌ Errore critico di connessione a MongoDB: **${error.message}**`);
    // Termina il processo con fallimento
    process.exit(1);
  }
};

module.exports = connectDB;