const config = require('../config/config');

// Store user request timestamps
const userRequests = new Map();

/**
 * Check if user is rate limited
 * @param {number} userId - User ID
 * @returns {boolean} True if user is rate limited
 */
function isRateLimited(userId) {
  const now = Date.now();
  const userRequestTimes = userRequests.get(userId) || [];
  
  // Filter out old requests
  const recentRequests = userRequestTimes.filter(time => now - time < config.rateLimit.timeWindow);
  
  return recentRequests.length >= config.rateLimit.maxRequests;
}

/**
 * Update rate limit for user
 * @param {number} userId - User ID
 */
function updateRateLimit(userId) {
  const now = Date.now();
  const userRequestTimes = userRequests.get(userId) || [];
  
  // Add current request time
  userRequestTimes.push(now);
  
  // Filter out old requests
  const recentRequests = userRequestTimes.filter(time => now - time < config.rateLimit.timeWindow);
  
  // Update stored requests
  userRequests.set(userId, recentRequests);
}

/**
 * Clean up old rate limit data
 */
function cleanupRateLimitData() {
  const now = Date.now();
  const cleanupTime = config.rateLimit.timeWindow * 2; // Clean up data older than 2 time windows
  
  for (const [userId, requestTimes] of userRequests.entries()) {
    const recentRequests = requestTimes.filter(time => now - time < cleanupTime);
    
    if (recentRequests.length === 0) {
      userRequests.delete(userId);
    } else {
      userRequests.set(userId, recentRequests);
    }
  }
}

// Set up periodic cleanup
setInterval(cleanupRateLimitData, config.rateLimit.timeWindow * 2);

module.exports = {
  isRateLimited,
  updateRateLimit,
  cleanupRateLimitData
};
