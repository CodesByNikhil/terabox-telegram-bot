const { Telegraf } = require('telegraf');
const config = require('./config/config');
const commandHandler = require('./handlers/commandHandler');
const linkHandler = require('./handlers/linkHandler');
const userHandler = require('./handlers/userHandler');
const logger = require('./utils/logger');
const helpers = require('./utils/helpers');

// Initialize bot
const bot = new Telegraf(config.botToken);

// Set up command handlers
commandHandler.setupCommandHandlers(bot);

// Handle text messages (Terabox links)
bot.on('text', async (ctx) => {
  const messageText = ctx.message.text;
  
  // Check if message contains a Terabox link
  const teraboxRegex = /https?:\/\/(www\.)?(terabox|1024tera)\.com\/(s\/|sharing\/)?[^\s]+/gi;
  const isTeraboxLink = teraboxRegex.test(messageText);
  
  if (isTeraboxLink) {
    await linkHandler.handleTeraboxLink(ctx);
  }
});

// Error handling
bot.catch((err, ctx) => {
  logger.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('❌ An error occurred while processing your request.');
});

// Start the bot
if (process.env.NODE_ENV === 'production') {
  // Webhook mode for production
  const PORT = config.server.port;
  const domain = config.server.webhookDomain;
  
  bot.launch({
    webhook: {
      domain: domain,
      port: PORT
    }
  }).then(() => {
    logger.info(`Bot is running in webhook mode on port ${PORT}`);
  });
} else {
  // Polling mode for development
  bot.launch().then(() => {
    logger.info('Bot is running in polling mode');
  });
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Periodic cleanup of temporary files
setInterval(() => {
  helpers.cleanupTempFiles(config.storage.tempDir);
}, config.storage.cleanupInterval);

// Background verification check
setInterval(async () => {
  try {
    const verifiedUsers = Array.from(userHandler.getVerifiedUsers());
    for (const userId of verifiedUsers) {
      const status = await userHandler.getUserMembershipStatus(userId);
      if (!status.allRequiredJoined) {
        userHandler.getVerifiedUsers().delete(userId);
        logger.info(`Removed user ${userId} from verified users (left required channels)`);
      }
    }
  } catch (error) {
    logger.error('Error in background verification check:', error);
  }
}, config.verification.checkInterval);

module.exports = bot;
