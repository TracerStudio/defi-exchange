const TelegramBot = require('node-telegram-bot-api');

// Telegram Bot Token
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7769270215:AAH_R-Q14oxkKHU0a53xK4_evXWiQJBiO54';

// URL вашого бота на Render (замініть на ваш URL)
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://defi-exchange-bot.onrender.com';

console.log('🔧 SETTING UP WEBHOOK...');
console.log(`🤖 Bot Token: ${BOT_TOKEN.substring(0, 10)}...`);
console.log(`🌐 Webhook URL: ${WEBHOOK_URL}`);

// Створюємо тимчасовий бот для налаштування webhook
const tempBot = new TelegramBot(BOT_TOKEN);

async function setupWebhook() {
  try {
    console.log('1️⃣ Deleting old webhook...');
    await tempBot.deleteWebHook();
    console.log('✅ Old webhook deleted');
    
    console.log('2️⃣ Setting new webhook...');
    const webhookUrl = `${WEBHOOK_URL}/webhook/${BOT_TOKEN}`;
    console.log(`📡 Setting webhook to: ${webhookUrl}`);
    
    await tempBot.setWebHook(webhookUrl);
    console.log('✅ New webhook set');
    
    console.log('3️⃣ Getting webhook info...');
    const webhookInfo = await tempBot.getWebHookInfo();
    console.log('📡 Webhook info:', webhookInfo);
    
    console.log('4️⃣ Testing webhook...');
    const botInfo = await tempBot.getMe();
    console.log(`✅ Bot info: @${botInfo.username} (${botInfo.first_name})`);
    
    console.log('✅ WEBHOOK SETUP COMPLETED!');
    console.log('🎉 Your bot is now ready to receive messages via webhook!');
    
  } catch (error) {
    console.error('❌ Error setting up webhook:', error.message);
    
    if (error.response && error.response.body) {
      console.log('Response body:', error.response.body);
    }
  }
  
  process.exit(0);
}

setupWebhook();
