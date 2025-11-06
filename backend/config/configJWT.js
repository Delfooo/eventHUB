/* Configurazione JWT */
const configJWT = {
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

module.exports = configJWT;