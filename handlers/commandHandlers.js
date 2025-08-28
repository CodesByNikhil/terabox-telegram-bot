const config = require('../config/config');
const userHandler = require('./userHandler');

/**
 * Handles all bot commands
 * @param {Telegraf} bot - The Telegraf bot instance
 */
function setupCommandHandlers(bot) {
  // Start command
  bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name;
    
    // Send welcome message
    await ctx.replyWithHTML(
      `👋 Hello <b>${username}</b>!\n\n` +
      `⚡ <b>Ultra-Fast Terabox Download Bot</b>\n\n` +
      `I can download any Terabox content and send it directly to you on Telegram.\n\n` +
      `✨ <b>Features:</b>\n` +
      `• Multiple file/folder support\n` +
      `• Large file support (up to 2GB)\n` +
      `• Media, documents, videos, photos\n` +
      `• 24/7 active service\n` +
      `• Fast download and delivery\n\n` +
      `To get started, please join our channels to use this bot.`
    );
    
    // Send join buttons for all channels
    await sendChannelJoinButtons(ctx, userId);
  });
  
  // Help command
  bot.help((ctx) => {
    ctx.replyWithHTML(
      `⚡ <b>Ultra-Fast Terabox Download Bot</b>\n\n` +
      `<b>How to use this bot:</b>\n\n` +
      `1. Send me any Terabox link (file, folder, media, document, video, photo)\n` +
      `2. I'll download the content from Terabox\n` +
      `3. I'll send the content directly to you on Telegram\n\n` +
      `<b>Supported content types:</b>\n` +
      `• Videos (MP4, MKV, AVI, etc.)\n` +
      `• Photos (JPG, PNG, etc.)\n` +
      `• Documents (PDF, DOC, ZIP, etc.)\n` +
      `• Audio files (MP3, WAV, etc.)\n` +
      `• Folders (all files will be sent)\n\n` +
      `<b>Commands:</b>\n` +
      `/start - Start the bot\n` +
      `/help - Show this help message\n` +
      `/status - Check your membership status\n` +
      `/verify - Verify your channel memberships`
    );
  });
  
  // Status command
  bot.command('status', async (ctx) => {
    const userId = ctx.from.id;
    const status = await userHandler.getUserMembershipStatus(userId);
    
    let message = `<b>Your Membership Status:</b>\n\n`;
    
    config.privateChannels.forEach((channel) => {
      const statusEmoji = status[channel.id] ? '✅' : '❌';
      const requiredText = channel.required ? '(Required)' : '(Optional)';
      message += `${statusEmoji} ${channel.name} ${requiredText}: ${status[channel.id] ? 'Joined' : 'Not Joined'}\n`;
    });
    
    message += `\n${status.allRequiredJoined ? '✅ You can now use the bot!' : '❌ Please join all required channels to use the bot.'}`;
    
    await ctx.replyWithHTML(message);
    
    if (!status.allRequiredJoined) {
      await sendChannelJoinButtons(ctx, userId);
    }
  });
  
  // Verify command
  bot.command('verify', async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name;
    
    // Check if user is in cooldown period
    if (userHandler.isUserInCooldown(userId)) {
      const cooldownTime = userHandler.getCooldownTime(userId);
      await ctx.reply(`Please wait ${Math.ceil(cooldownTime / 60000)} minutes before trying to verify again.`);
      return;
    }
    
    const processingMsg = await ctx.reply('🔍 Verifying your channel memberships...');
    
    try {
      const verificationResult = await userHandler.verifyUserMembership(userId);
      
      let message = `<b>Verification Results for ${username}:</b>\n\n`;
      let allRequiredJoined = true;
      
      config.privateChannels.forEach((channel) => {
        const status = verificationResult[channel.id] ? '✅ Joined' : '❌ Not Joined';
        const requiredText = channel.required ? '(Required)' : '(Optional)';
        message += `${channel.name} ${requiredText}: ${status}\n`;
        
        if (channel.required && !verificationResult[channel.id]) {
          allRequiredJoined = false;
        }
      });
      
      message += `\n${allRequiredJoined ? '✅ All required channels verified! You can now use the bot.' : '❌ Please join all required channels to use the bot.'}`;
      
      await ctx.telegram.editMessageText(
        processingMsg.chat.id,
        processingMsg.message_id,
        null,
        message,
        { parse_mode: 'HTML' }
      );
      
      if (allRequiredJoined) {
        userHandler.addVerifiedUser(userId);
      } else {
        userHandler.incrementVerificationAttempts(userId);
        await sendChannelJoinButtons(ctx, userId);
      }
    } catch (error) {
      console.error('Verification error:', error);
      await ctx.telegram.editMessageText(
        processingMsg.chat.id,
        processingMsg.message_id,
        null,
        '❌ Error verifying your memberships. Please try again later.'
      );
    }
  });
  
  // Handle callback for membership check
  bot.action('check_membership', async (ctx) => {
    const userId = ctx.from.id;
    
    // Check if user is in cooldown period
    if (userHandler.isUserInCooldown(userId)) {
      const cooldownTime = userHandler.getCooldownTime(userId);
      await ctx.answerCbQuery(`Please wait ${Math.ceil(cooldownTime / 60000)} minutes before trying again.`);
      return;
    }
    
    await ctx.answerCbQuery('Verifying your memberships...');
    
    const verificationResult = await userHandler.verifyUserMembership(userId);
    const allRequiredJoined = config.privateChannels
      .filter(channel => channel.required)
      .every(channel => verificationResult[channel.id]);
    
    if (allRequiredJoined) {
      await ctx.editMessageText('✅ All required channels verified! You can now use the bot by sending Terabox links.');
      userHandler.addVerifiedUser(userId);
    } else {
      userHandler.incrementVerificationAttempts(userId);
      await ctx.editMessageText('❌ Not all required channels verified. Please join all channels and try again.');
      await sendChannelJoinButtons(ctx, userId);
    }
  });
}

/**
 * Send join buttons for all channels
 * @param {Object} ctx - Telegraf context
 * @param {number} userId - User ID
 */
async function sendChannelJoinButtons(ctx, userId) {
  const buttons = [];
  
  // Add buttons for each channel
  config.privateChannels.forEach((channel) => {
    const requiredText = channel.required ? '(Required)' : '(Optional)';
    buttons.push([
      {
        text: `Join ${channel.name} ${requiredText}`,
        url: channel.inviteLink
      }
    ]);
  });
  
  // Add verification button
  buttons.push([
    {
      text: '✅ I Have Joined All Channels',
      callback_data: 'check_membership'
    }
  ]);
  
  await ctx.reply('Please join all channels below to use the bot:', {
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

module.exports = { setupCommandHandlers };
