const { Telegraf } = require('telegraf');
const config = require('../config/config');

// In-memory storage for verified users and verification attempts
const verifiedUsers = new Set();
const verificationAttempts = new Map();
const verificationCooldowns = new Map();

/**
 * Check if a user is a member of specific channel
 * @param {number} userId - The Telegram user ID to check
 * @param {string} channelId - The channel ID to check
 * @returns {boolean} True if user is a member
 */
async function checkChannelMembership(userId, channelId) {
  try {
    // Create a temporary bot instance to check membership
    const bot = new Telegraf(config.botToken);
    const member = await bot.telegram.getChatMember(channelId, userId);
    
    return ['member', 'administrator', 'creator'].includes(member.status);
  } catch (error) {
    console.error(`Error checking membership for channel ${channelId}:`, error);
    return false;
  }
}

/**
 * Verify user membership in all channels
 * @param {number} userId - The Telegram user ID to verify
 * @returns {Object} Object with channel IDs as keys and membership status as values
 */
async function verifyUserMembership(userId) {
  const results = {};
  
  // Check membership for each channel
  for (const channel of config.privateChannels) {
    results[channel.id] = await checkChannelMembership(userId, channel.id);
  }
  
  return results;
}

/**
 * Get user membership status for all channels
 * @param {number} userId - The Telegram user ID
 * @returns {Object} Membership status object
 */
async function getUserMembershipStatus(userId) {
  const status = await verifyUserMembership(userId);
  const allRequiredJoined = config.privateChannels
    .filter(channel => channel.required)
    .every(channel => status[channel.id]);
  
  return {
    ...status,
    allRequiredJoined
  };
}

/**
 * Add a user to the verified users list
 * @param {number} userId - The Telegram user ID to add
 */
function addVerifiedUser(userId) {
  verifiedUsers.add(userId);
  // Reset verification attempts when user is verified
  verificationAttempts.delete(userId);
  verificationCooldowns.delete(userId);
}

/**
 * Check if a user is verified
 * @param {number} userId - The Telegram user ID to check
 * @returns {boolean} True if user is verified
 */
function isUserVerified(userId) {
  return verifiedUsers.has(userId);
}

/**
 * Increment verification attempts for a user
 * @param {number} userId - The Telegram user ID
 */
function incrementVerificationAttempts(userId) {
  const attempts = verificationAttempts.get(userId) || 0;
  verificationAttempts.set(userId, attempts + 1);
  
  // If user exceeds max attempts, set cooldown
  if (attempts + 1 >= config.verification.maxAttempts) {
    setUserCooldown(userId);
  }
}

/**
 * Set cooldown for a user
 * @param {number} userId - The Telegram user ID
 */
function setUserCooldown(userId) {
  verificationCooldowns.set(userId, Date.now() + config.verification.cooldownTime);
}

/**
 * Check if user is in cooldown period
 * @param {number} userId - The Telegram user ID
 * @returns {boolean} True if user is in cooldown
 */
function isUserInCooldown(userId) {
  const cooldownEnd = verificationCooldowns.get(userId);
  return cooldownEnd && Date.now() < cooldownEnd;
}

/**
 * Get remaining cooldown time for user
 * @param {number} userId - The Telegram user ID
 * @returns {number} Remaining cooldown time in milliseconds
 */
function getCooldownTime(userId) {
  const cooldownEnd = verificationCooldowns.get(userId);
  return cooldownEnd ? cooldownEnd - Date.now() : 0;
}

/**
 * Get all verified users
 * @returns {Set} Set of verified user IDs
 */
function getVerifiedUsers() {
  return verifiedUsers;
}

module.exports = {
  checkChannelMembership,
  verifyUserMembership,
  getUserMembershipStatus,
  addVerifiedUser,
  isUserVerified,
  incrementVerificationAttempts,
  isUserInCooldown,
  getCooldownTime,
  getVerifiedUsers
};
