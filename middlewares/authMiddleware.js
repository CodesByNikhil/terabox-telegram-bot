const userHandler = require('../handlers/userHandler');
const config = require('../config/config');

/**
 * Check if user is authenticated and authorized
 * @param {Object} ctx - Telegraf context object
 * @returns {Object} Authentication result
 */
async function checkAuth(ctx) {
  const userId = ctx.from.id;
  
  // Check if user is verified
  if (userHandler.isUserVerified(userId)) {
    return { success: true };
  }
  
  // Check if user is in all required channels
  const status = await userHandler.getUserMembershipStatus(userId);
  
  if (status.allRequiredJoined) {
    userHandler.addVerifiedUser(userId);
    return { success: true };
  }
  
  return {
    success: false,
    message: '❌ Please join all required channels first to use this bot. Use /start to get the join links.'
  };
}

module.exports = {
  checkAuth
};
