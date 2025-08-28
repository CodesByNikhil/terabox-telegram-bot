const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Send file to user via Telegram
 * @param {Object} ctx - Telegraf context object
 * @param {string} filePath - Path to the file
 * @param {Object} fileInfo - File information object
 */
async function sendFileToUser(ctx, filePath, fileInfo) {
  try {
    const fileStats = fs.statSync(filePath);
    const fileSize = fileStats.size;
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      await ctx.reply('❌ File not found. Please try again.');
      return;
    }
    
    // Check file size against Telegram limits
    if (fileSize > config.telegram.maxFileSize) {
      await ctx.reply(`❌ File is too large (${formatFileSize(fileSize)}). Maximum allowed size is 2GB.`);
      fs.unlinkSync(filePath); // Clean up
      return;
    }
    
    // Send appropriate message based on file type
    if (fileInfo.type === 'folder' || filePath.endsWith('.zip')) {
      await ctx.replyWithDocument({ source: filePath }, {
        caption: `📁 ${fileInfo.name || 'Terabox Folder'}\nSize: ${formatFileSize(fileSize)}`
      });
    } else if (fileInfo.fileType === 'video') {
      if (fileSize <= config.telegram.maxVideoSize) {
        await ctx.replyWithVideo({ source: filePath }, {
          caption: `🎥 ${fileInfo.name || 'Terabox Video'}\nSize: ${formatFileSize(fileSize)}`
        });
      } else {
        await ctx.replyWithDocument({ source: filePath }, {
          caption: `📁 ${fileInfo.name || 'Terabox Video'}\nSize: ${formatFileSize(fileSize)}`
        });
      }
    } else if (fileInfo.fileType === 'image') {
      if (fileSize <= config.telegram.maxPhotoSize) {
        await ctx.replyWithPhoto({ source: filePath }, {
          caption: `🖼️ ${fileInfo.name || 'Terabox Image'}\nSize: ${formatFileSize(fileSize)}`
        });
      } else {
        await ctx.replyWithDocument({ source: filePath }, {
          caption: `📁 ${fileInfo.name || 'Terabox Image'}\nSize: ${formatFileSize(fileSize)}`
        });
      }
    } else {
      // Send as document for other file types
      await ctx.replyWithDocument({ source: filePath }, {
        caption: `📄 ${fileInfo.name || 'Terabox File'}\nSize: ${formatFileSize(fileSize)}`
      });
    }
    
    // Clean up temporary file
    fs.unlinkSync(filePath);
    
  } catch (error) {
    logger.error('Error sending file to user:', error);
    
    // Clean up on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Fallback: send error message
    await ctx.reply('❌ Error sending file. Please try again later.');
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

module.exports = {
  sendFileToUser,
  formatFileSize
};
