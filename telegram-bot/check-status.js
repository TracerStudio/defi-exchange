const TelegramBot = require('node-telegram-bot-api');

// Telegram Bot Token
const BOT_TOKEN = '7769270215:AAH_R-Q14oxkKHU0a53xK4_evXWiQJBiO54';

console.log('🔍 CHECKING BOT STATUS...');

// Створюємо тимчасовий бот для перевірки
const tempBot = new TelegramBot(BOT_TOKEN);

async function checkBotStatus() {
  try {
    console.log('1️⃣ Getting bot info...');
    const botInfo = await tempBot.getMe();
    console.log(`✅ Bot info: @${botInfo.username} (${botInfo.first_name})`);
    
    console.log('2️⃣ Getting webhook info...');
    const webhookInfo = await tempBot.getWebHookInfo();
    console.log('📡 Webhook info:', webhookInfo);
    
    if (webhookInfo.url) {
      console.log('⚠️ WARNING: Webhook is set to:', webhookInfo.url);
      console.log('⚠️ This might cause conflicts with polling!');
    } else {
      console.log('✅ No webhook set - polling should work');
    }
    
    console.log('3️⃣ Testing getUpdates (this will fail if another instance is running)...');
    try {
      const updates = await tempBot.getUpdates({ limit: 1, timeout: 1 });
      console.log('✅ getUpdates works - no conflicts detected');
      console.log('📊 Pending updates:', updates.length);
    } catch (updateError) {
      if (updateError.code === 409) {
        console.log('❌ CONFLICT DETECTED: Another bot instance is running!');
        console.log('❌ Error:', updateError.message);
      } else {
        console.log('⚠️ getUpdates error:', updateError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking bot status:', error.message);
  }
  
  process.exit(0);
}

checkBotStatus();
