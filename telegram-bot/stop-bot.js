const TelegramBot = require('node-telegram-bot-api');

// Telegram Bot Token
const BOT_TOKEN = '7769270215:AAH_R-Q14oxkKHU0a53xK4_evXWiQJBiO54';

console.log('🛑 Stopping all bot instances...');

// Створюємо тимчасовий бот для зупинки webhook
const tempBot = new TelegramBot(BOT_TOKEN);

async function stopBot() {
  try {
    // Зупиняємо webhook якщо він активний
    await tempBot.deleteWebHook();
    console.log('✅ Webhook deleted');
    
    // Отримуємо інформацію про бота
    const botInfo = await tempBot.getMe();
    console.log(`✅ Bot info: @${botInfo.username} (${botInfo.first_name})`);
    
    // Додатково перевіряємо та очищаємо webhook
    try {
      const webhookInfo = await tempBot.getWebHookInfo();
      console.log('📡 Webhook info:', webhookInfo);
    } catch (webhookError) {
      console.log('📡 No webhook info available');
    }
    
    console.log('✅ Bot stopped successfully');
    
  } catch (error) {
    console.error('❌ Error stopping bot:', error.message);
    
    if (error.response && error.response.body) {
      console.log('Response body:', error.response.body);
    }
  }
  
  process.exit(0);
}

stopBot();
