require('dotenv').config();

module.exports = {
  // Telegram Bot Token from @BotFather
  botToken: process.env.BOT_TOKEN,
  
  // Multiple private channels and group details
  privateChannels: [
    {
      id: process.env.CHANNEL_1_ID,
      name: "Premium Channel 1",
      inviteLink: process.env.CHANNEL_1_INVITE_LINK,
      required: true
    },
    {
      id: process.env.CHANNEL_2_ID,
      name: "Premium Channel 2",
      inviteLink: process.env.CHANNEL_2_INVITE_LINK,
      required: true
    },
    {
      id: process.env.CHANNEL_3_ID,
      name: "Exclusive Content",
      inviteLink: process.env.CHANNEL_3_INVITE_LINK,
      required: true
    },
    {
      id: process.env.CHANNEL_4_ID,
      name: "VIP Access",
      inviteLink: process.env.CHANNEL_4_INVITE_LINK,
      required: true
    },
    {
      id: process.env.GROUP_1_ID,
      name: "Premium Community",
      inviteLink: process.env.GROUP_1_INVITE_LINK,
      required: false
    }
  ],
  
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    webhookDomain: process.env.WEBHOOK_DOMAIN
  },
  
  // Terabox configuration
  terabox: {
    downloadTimeout: 300000, // 5 minutes
    maxFileSize: 2000 * 1024 * 1024, // 2GB
    concurrentDownloads: 3,
    retryAttempts: 3,
    retryDelay: 5000
  },
  
  // Telegram limits
  telegram: {
    maxFileSize: 2000 * 1024 * 1024, // 2GB
    maxPhotoSize: 10 * 1024 * 1024, // 10MB
    maxVideoSize: 2000 * 1024 * 1024, // 2GB
    maxDocumentSize: 2000 * 1024 * 1024 // 2GB
  },
  
  // Verification settings
  verification: {
    maxAttempts: 3,
    cooldownTime: 300000, // 5 minutes
    checkInterval: 60000 // 1 minute
  },
  
  // Rate limiting
  rateLimit: {
    maxRequests: 5,
    timeWindow: 60000 // 1 minute
  },
  
  // Storage
  storage: {
    tempDir: process.env.TEMP_DIR || '/tmp/terabox_downloads',
    cleanupInterval: 3600000 // 1 hour
  }
};
