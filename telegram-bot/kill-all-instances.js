const TelegramBot = require('node-telegram-bot-api');

// Telegram Bot Token
const BOT_TOKEN = '7769270215:AAH_R-Q14oxkKHU0a53xK4_evXWiQJBiO54';

console.log('💀 KILLING ALL BOT INSTANCES...');

// Створюємо тимчасовий бот для примусової зупинки
const tempBot = new TelegramBot(BOT_TOKEN);

async function killAllInstances() {
  try {
    console.log('1️⃣ Setting webhook to invalid URL to break other instances...');
    // Встановлюємо невалідний webhook, щоб зламати інші екземпляри
    await tempBot.setWebHook('https://invalid-url-that-will-break-other-instances.com/webhook');
    console.log('✅ Invalid webhook set');
    
    console.log('2️⃣ Waiting 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('3️⃣ Deleting webhook completely...');
    await tempBot.deleteWebHook();
    console.log('✅ Webhook deleted');
    
    console.log('4️⃣ Setting empty webhook...');
    await tempBot.setWebHook('');
    console.log('✅ Empty webhook set');
    
    console.log('5️⃣ Final check...');
    const webhookInfo = await tempBot.getWebHookInfo();
    console.log('📡 Final webhook info:', webhookInfo);
    
    console.log('6️⃣ Testing getUpdates...');
    try {
      const updates = await tempBot.getUpdates({ limit: 1, timeout: 1 });
      console.log('✅ getUpdates works - conflicts resolved!');
    } catch (updateError) {
      if (updateError.code === 409) {
        console.log('❌ STILL CONFLICT: Another instance is still running');
        console.log('❌ You may need to check Render dashboard or other servers');
      } else {
        console.log('⚠️ getUpdates error:', updateError.message);
      }
    }
    
    console.log('✅ KILL ALL INSTANCES COMPLETED!');
    
  } catch (error) {
    console.error('❌ Error during kill all instances:', error.message);
  }
  
  process.exit(0);
}

killAllInstances();
