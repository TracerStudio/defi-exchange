const TelegramBot = require('node-telegram-bot-api');

// Telegram Bot Token
const BOT_TOKEN = '7769270215:AAH_R-Q14oxkKHU0a53xK4_evXWiQJBiO54';

console.log('🛑 FORCE STOPPING ALL BOT INSTANCES...');

// Створюємо тимчасовий бот для примусової зупинки
const tempBot = new TelegramBot(BOT_TOKEN);

async function forceStopBot() {
  try {
    console.log('1️⃣ Deleting webhook...');
    await tempBot.deleteWebHook();
    console.log('✅ Webhook deleted');
    
    console.log('2️⃣ Getting webhook info...');
    const webhookInfo = await tempBot.getWebHookInfo();
    console.log('📡 Webhook info:', webhookInfo);
    
    console.log('3️⃣ Getting bot info...');
    const botInfo = await tempBot.getMe();
    console.log(`✅ Bot info: @${botInfo.username} (${botInfo.first_name})`);
    
    console.log('4️⃣ Setting empty webhook...');
    await tempBot.setWebHook('');
    console.log('✅ Empty webhook set');
    
    console.log('5️⃣ Final webhook check...');
    const finalWebhookInfo = await tempBot.getWebHookInfo();
    console.log('📡 Final webhook info:', finalWebhookInfo);
    
    console.log('✅ FORCE STOP COMPLETED!');
    
  } catch (error) {
    console.error('❌ Error during force stop:', error.message);
    
    if (error.response && error.response.body) {
      console.log('Response body:', error.response.body);
    }
  }
  
  process.exit(0);
}

forceStopBot();
