const config = {
  // Database
  mongoUri: process.env.MONGODB_URI || 'mongodb+srv://michelangelodelfino_db_user:Jb2xqY6rtKySzhLL@eventhub.05x1kum.mongodb.net/eventhub?appName=eventHub',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
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

module.exports = config;