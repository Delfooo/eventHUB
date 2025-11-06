// Recupera le statistiche amministrative, come il numero totale di utenti, utenti attivi, blocati, amministratori e normali.
// Include anche il tasso di attivazione utenti (utenti attivi rispetto al totale).
// Restituisce le statistiche in formato JSON.

const User = require('../models/User');

// Dashboard admin - statistiche
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const blockedUsers = await User.countDocuments({ isActive: false });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const regularUsers = await User.countDocuments({ role: 'user' });

    // Utenti registrati negli ultimi 30 giorni
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        blockedUsers,
        adminUsers,
        regularUsers,
        recentUsers,
        activityRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Errore nel recupero statistiche:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero statistiche admin'
    });
  }
};

module.exports = { getAdminStats };