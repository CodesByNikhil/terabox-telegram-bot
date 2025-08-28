const teraboxService = require('../services/teraboxService');
const telegramService = require('../services/telegramService');
const userHandler = require('./userHandler');
const authMiddleware = require('../middlewares/authMiddleware');
const rateLimiter = require('../utils/rateLimiter');
const logger = require('../utils/logger');

/**
 * Handle Terabox links sent by users
 * @param {Object} ctx - Telegraf context object
 */
async function handleTeraboxLink(ctx) {
  const userId = ctx.from.id;
  const messageText = ctx.message.text;
  
  // Check authentication
  const authResult = await authMiddleware.checkAuth(ctx);
  if (!authResult.success) {
    await ctx.reply(authResult.message);
    return;
  }
  
  // Check rate limit
  if (rateLimiter.isRateLimited(userId)) {
    await ctx.reply('⏳ Please wait a moment before sending another request.');
    return;
  }
  
  // Check if the message contains a Terabox link
  const teraboxRegex = /https?:\/\/(www\.)?(terabox|1024tera)\.com\/(s\/|sharing\/)?[^\s]+/gi;
  const matches = messageText.match(teraboxRegex);
  
  if (!matches || matches.length === 0) {
    await ctx.reply('❌ Please send a valid Terabox link.');
    return;
  }
  
  // Update rate limit
  rateLimiter.updateRateLimit(userId);
  
  // Send processing message
  const processingMsg = await ctx.reply('⏳ Processing your Terabox link...');
  
  try {
    // Process each link
    for (const link of matches) {
      // Get file info first
      const fileInfo = await teraboxService.getFileInfo(link);
      
      if (!fileInfo || fileInfo.error) {
        await ctx.reply(`❌ Failed to process link: ${link}\nError: ${fileInfo?.error || 'Unknown error'}`);
        continue;
      }
      
      // Check file size
      if (fileInfo.size > config.telegram.maxFileSize) {
        await ctx.reply(`❌ File is too large (${formatFileSize(fileInfo.size)}). Maximum allowed size is 2GB.`);
        continue;
      }
      
      // Download the file
      const downloadResult = await teraboxService.downloadFile(link, fileInfo);
      
      if (!downloadResult.success) {
        await ctx.reply(`❌ Download failed: ${downloadResult.error}`);
        continue;
      }
      
      // Send the file to user
      await telegramService.sendFileToUser(ctx, downloadResult.filePath, fileInfo);
    }
    
    // Update processing message
    await ctx.telegram.editMessageText(
      processingMsg.chat.id,
      processingMsg.message_id,
      null,
      '✅ All files processed successfully!'
    );
  } catch (error) {
    logger.error('Error processing Terabox link:', error);
    
    // Update processing message
    await ctx.telegram.editMessageText(
      processingMsg.chat.id,
      processingMsg.message_id,
      null,
      '❌ Error processing your link. Please try again later.'
    );
  }
}

/**
 * Format file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = { handleTeraboxLink };
