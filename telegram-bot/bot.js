const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

// Telegram Bot Token (заміни на свій токен)
const BOT_TOKEN = '7769270215:AAH_R-Q14oxkKHU0a53xK4_evXWiQJBiO54'; // ID адміна для отримання заявок
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '-1002573326301'; // Можна змінити через змінну середовища
const ADMIN_SERVER_URL = process.env.ADMIN_SERVER_URL || 'https://defi-exchange-main.onrender.com'; // URL адмін сервера

// Створюємо бота з обробкою помилок
const bot = new TelegramBot(BOT_TOKEN, { 
  polling: {
    interval: 1000,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
});

// Обробка помилок polling
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
  
  if (error.code === 409) {
    console.log('🔄 Conflict detected - stopping polling and restarting...');
    bot.stopPolling();
    setTimeout(() => {
      console.log('🔄 Restarting bot polling...');
      bot.startPolling();
    }, 5000);
  }
});

// Обробка помилок webhook
bot.on('webhook_error', (error) => {
  console.error('❌ Webhook error:', error.message);
});

console.log(`🤖 Telegram Bot initialized`);
console.log(`📱 Admin Chat ID: ${ADMIN_CHAT_ID}`);
console.log(`🔑 Bot Token: ${BOT_TOKEN.substring(0, 10)}...`);
console.log(`🌐 Admin Server URL: ${ADMIN_SERVER_URL}`);

// Зберігаємо заявки
let withdrawalRequests = new Map();
let requestCounter = 1;

// Fun usernames for each request
const funUsernames = [
  "CryptoWhale", "DeFiDragon", "BlockchainBoss", "TokenTrader", "SwapMaster",
  "DiamondHands", "MoonRocket", "CryptoKing", "EthereumEagle", "BitcoinBull",
  "DeFiNinja", "TokenTitan", "SwapSage", "CryptoCrusader", "BlockchainBeast",
  "DiamondDuke", "MoonMaven", "CryptoChampion", "EthereumElite", "BitcoinBaron",
  "DeFiDynamo", "TokenTiger", "SwapSorcerer", "CryptoCaptain", "BlockchainBrawler",
  "DiamondDynamo", "MoonMage", "CryptoCommander", "EthereumEmperor", "BitcoinBishop",
  "DeFiDuke", "TokenTornado", "SwapSamurai", "CryptoCzar", "BlockchainBaron",
  "DiamondDragon", "MoonMystic", "CryptoCrown", "EthereumEagle", "BitcoinBaller",
  "DeFiDaredevil", "TokenTitan", "SwapSultan", "CryptoCrusader", "BlockchainBoss"
];

// Function to get random fun username
const getRandomUsername = () => {
  return funUsernames[Math.floor(Math.random() * funUsernames.length)];
};

// Function to update withdrawal status in database
const updateWithdrawalStatusInDatabase = async (requestId, status, userAddress) => {
  try {
    console.log(`Updating withdrawal ${requestId} status to ${status} in database`);
    
    const fs = require('fs');
    const path = require('path');
    
    // Update the main withdrawal requests file
    const requestsFile = path.join(__dirname, '..', 'database', `withdrawal_requests_${userAddress}.json`);
    let requests = [];
    
    try {
      if (fs.existsSync(requestsFile)) {
        const data = fs.readFileSync(requestsFile, 'utf8');
        requests = JSON.parse(data);
      }
    } catch (e) {
      console.log('Creating new withdrawal requests file');
    }
    
    // Find the request
    const requestIndex = requests.findIndex(req => req.id === requestId);
    if (requestIndex !== -1) {
      if (status === 'approved') {
        // Видаляємо запит з бази даних після підтвердження
        requests.splice(requestIndex, 1);
        console.log(`✅ Approved and removed withdrawal request ${requestId} from database`);
      } else if (status === 'rejected') {
        // Оновлюємо статус для відхилених запитів
        requests[requestIndex].status = status;
        requests[requestIndex].updatedAt = new Date().toISOString();
        console.log(`✅ Updated withdrawal request ${requestId} status to ${status} in database`);
      }
      
      // Save updated requests
      fs.writeFileSync(requestsFile, JSON.stringify(requests, null, 2));
    } else {
      console.log(`⚠️ Request ${requestId} not found in database`);
    }
    
  } catch (error) {
    console.error('❌ Error updating withdrawal status in database:', error);
  }
};

// Function to save withdrawal request to database
const saveWithdrawalRequestToDatabase = async (request) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Path to user's withdrawal requests file
    const requestsFile = path.join(__dirname, '..', 'database', `withdrawal_requests_${request.userAddress}.json`);
    let requests = [];
    
    try {
      if (fs.existsSync(requestsFile)) {
        const data = fs.readFileSync(requestsFile, 'utf8');
        requests = JSON.parse(data);
      }
    } catch (e) {
      console.log('Creating new withdrawal requests file for user:', request.userAddress);
    }
    
    // Add new request
    requests.push(request);
    
    // Save updated requests
    fs.writeFileSync(requestsFile, JSON.stringify(requests, null, 2));
    console.log(`✅ Saved withdrawal request ${request.id} to database for user ${request.userAddress}`);
    
  } catch (error) {
    console.error('❌ Error saving withdrawal request to database:', error);
  }
};

// Middleware для парсингу JSON
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Функція для оновлення балансів користувача
const updateUserBalances = async (userAddress, token, amount) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Шлях до файлу балансів користувача
    const balancesFile = path.join(__dirname, '..', 'database', `user_balances_${userAddress}.json`);
    
    // Читаємо поточні баланси
    let userBalances = {};
    if (fs.existsSync(balancesFile)) {
      const data = fs.readFileSync(balancesFile, 'utf8');
      userBalances = JSON.parse(data);
    }
    
    // Зменшуємо баланс після підтвердження виводу
    const currentBalance = parseFloat(userBalances[token] || 0);
    const withdrawAmount = parseFloat(amount);
    const newBalance = Math.max(0, currentBalance - withdrawAmount);
    
    userBalances[token] = newBalance;
    
    // Зберігаємо оновлені баланси
    fs.writeFileSync(balancesFile, JSON.stringify(userBalances, null, 2));
    
    console.log(`✅ Updated balances for user ${userAddress}:`);
    console.log(`   ${token}: ${currentBalance} → ${newBalance} (-${withdrawAmount})`);
    
    // Також оновлюємо загальний файл балансів
    const generalBalancesFile = path.join(__dirname, '..', 'database', 'user_balances.json');
    let generalBalances = {};
    
    if (fs.existsSync(generalBalancesFile)) {
      const data = fs.readFileSync(generalBalancesFile, 'utf8');
      generalBalances = JSON.parse(data);
    }
    
    // Оновлюємо загальні баланси
    if (!generalBalances[userAddress]) {
      generalBalances[userAddress] = {};
    }
    generalBalances[userAddress][token] = newBalance;
    
    fs.writeFileSync(generalBalancesFile, JSON.stringify(generalBalances, null, 2));
    
    console.log(`💾 Balances saved to database files`);
    
  } catch (error) {
    console.error('❌ Error updating user balances:', error);
  }
};

// Обробка заявок на вивід
app.post('/withdrawal-request', async (req, res) => {
  try {
    const { token, amount, address, userAddress } = req.body;
    
    // Створюємо заявку з прикольним бзернеймом
    const requestId = `WR-${Date.now()}-${requestCounter++}`;
    const funUsername = getRandomUsername();
    const request = {
      id: requestId,
      token,
      amount,
      address,
      userAddress,
      funUsername,
      status: 'pending',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    // Зберігаємо заявку в пам'яті
    withdrawalRequests.set(requestId, request);
    
    // Зберігаємо заявку в базу даних
    await saveWithdrawalRequestToDatabase(request);
    
    // Відправляємо повідомлення адміну з прикольним стилем
    const message = `
🔥 *NEW WITHDRAWAL REQUEST* 🔥

🎯 *Request ID:* \`${requestId}\`
💰 *Token:* ${token}
💎 *Amount:* ${amount}

🏦 *CRYPTO ADDRESS:*
\`${address}\`

👑 *User:* ${funUsername}
⏰ *Time:* ${new Date().toLocaleString('en-US')}

🚀 *Ready to process this withdrawal?*
    `;
    
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '✅ APPROVE WITHDRAWAL',
            callback_data: `approve_${requestId}`
          },
          {
            text: '❌ REJECT REQUEST',
            callback_data: `reject_${requestId}`
          }
        ]
      ]
    };
    
    try {
      await bot.sendMessage(ADMIN_CHAT_ID, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      console.log(`✅ Withdrawal request sent to Telegram: ${requestId}`);
    } catch (error) {
      console.error(`❌ Error sending to Telegram: ${error.message}`);
      console.log(`📝 Request saved to database but not sent to Telegram: ${requestId}`);
      // Не зупиняємо процес, запит все одно зберігається в базі
    }
    
    res.json({ success: true, requestId });
    
  } catch (error) {
    console.error('Error processing withdrawal request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обробка callback кнопок
bot.on('callback_query', async (callbackQuery) => {
  const data = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  
  if (data.startsWith('approve_')) {
    const requestId = data.replace('approve_', '');
    const request = withdrawalRequests.get(requestId);
    
    if (request) {
      // Оновлюємо статус заявки
      request.status = 'approved';
      withdrawalRequests.set(requestId, request);
      
      // Update database for frontend
      await updateWithdrawalStatusInDatabase(requestId, 'approved', request.userAddress);
      
      // Відправляємо підтвердження
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '✅ WITHDRAWAL APPROVED! Funds are being processed.',
        show_alert: true
      });
      
      // Оновлюємо повідомлення
      const updatedMessage = `
🎉 *WITHDRAWAL APPROVED* 🎉

🎯 *Request ID:* \`${requestId}\`
💰 *Token:* ${request.token}
💎 *Amount:* ${request.amount}


🏦 *CRYPTO ADDRESS:*
\`${request.address}\`


👑 *User:* ${request.funUsername}
⏰ *Approved At:* ${new Date().toLocaleString('en-US')}

*Status:* ✅ APPROVED & PROCESSED
      `;
      
      await bot.editMessageText(updatedMessage, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });
      
         // Оновлюємо баланси користувача після підтвердження
         try {
           await updateUserBalances(request.userAddress, request.token, request.amount);
           
           console.log(`✅ Withdrawal approved: ${requestId}`);
           console.log(`💰 User ${request.userAddress} balance updated: -${request.amount} ${request.token}`);
           console.log(`📍 User should receive ${request.amount} ${request.token} to ${request.address}`);
         
         // Інструкції для адміна:
         console.log(`
         ========================================
         🚨 ADMIN INSTRUCTIONS:
         ========================================
         1. Transfer ${request.amount} ${request.token} from your wallet
         2. To crypto address: ${request.address}
         3. User balance has been automatically updated
         4. User will receive tokens on their address
         ========================================
         `);
         
           // Відправляємо повідомлення користувачу про підтвердження (якщо є можливість)
           try {
             console.log(`📱 User ${request.userAddress} will be notified about withdrawal approval`);
           } catch (notificationError) {
             console.error('Error sending notification to user:', notificationError);
           }
         
         } catch (error) {
           console.error('❌ Error processing withdrawal:', error);
         }
      
    } else {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ REQUEST NOT FOUND! Invalid request ID.',
        show_alert: true
      });
    }
    
  } else if (data.startsWith('reject_')) {
    const requestId = data.replace('reject_', '');
    const request = withdrawalRequests.get(requestId);
    
    if (request) {
      // Оновлюємо статус заявки
      request.status = 'rejected';
      withdrawalRequests.set(requestId, request);
      
      // Update database for frontend
      await updateWithdrawalStatusInDatabase(requestId, 'rejected', request.userAddress);
      
      // Відправляємо відхилення
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ REQUEST REJECTED! Withdrawal denied.',
        show_alert: true
      });
      
      // Оновлюємо повідомлення
      const updatedMessage = `
🚫 *REQUEST REJECTED* 🚫

🎯 *Request ID:* \`${requestId}\`
💰 *Token:* ${request.token}
💎 *Amount:* ${request.amount}


🏦 *CRYPTO ADDRESS:*
\`${request.address}\`


👑 *User:* ${request.funUsername}
⏰ *Rejected At:* ${new Date().toLocaleString('en-US')}

*Status:* ❌ REJECTED
      `;
      
      await bot.editMessageText(updatedMessage, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });
      
      console.log(`Withdrawal rejected: ${requestId}`);
      
    } else {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ REQUEST NOT FOUND! Invalid request ID.',
        show_alert: true
      });
    }
  }
});

// API endpoint для отримання статусу заявки
app.get('/withdrawal-status/:requestId', async (req, res) => {
  const { requestId } = req.params;
  
  console.log(`🔍 Checking status for request: ${requestId}`);
  
  // First check in memory
  let request = withdrawalRequests.get(requestId);
  
  if (request) {
    console.log(`✅ Found request in memory: ${requestId}, status: ${request.status}`);
    res.json({
      requestId: requestId,
      status: request.status,
      token: request.token,
      amount: request.amount,
      address: request.address,
      userAddress: request.userAddress
    });
    return;
  }
  
  // If not in memory, check database
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Extract user address from requestId (assuming format: WR-timestamp-counter)
    // We need to search through all user files
    const databaseDir = path.join(__dirname, '..', 'database');
    const files = fs.readdirSync(databaseDir);
    
    for (const file of files) {
      if (file.startsWith('withdrawal_requests_') && file.endsWith('.json')) {
        const filePath = path.join(databaseDir, file);
        const data = fs.readFileSync(filePath, 'utf8');
        const requests = JSON.parse(data);
        
        const foundRequest = requests.find(req => req.id === requestId);
        if (foundRequest) {
          console.log(`✅ Found request in database: ${requestId}, status: ${foundRequest.status}`);
          res.json({
            requestId: requestId,
            status: foundRequest.status,
            token: foundRequest.token,
            amount: foundRequest.amount,
            address: foundRequest.address,
            userAddress: foundRequest.userAddress
          });
          return;
        }
      }
    }
    
    console.log(`❌ Request not found in memory or database: ${requestId}`);
    res.status(404).json({ error: 'Request not found' });
    
  } catch (error) {
    console.error('❌ Error checking request status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint для оновлення балансів користувача
app.post('/update-user-balance', (req, res) => {
  try {
    const { userAddress, token, amount, operation } = req.body;
    
    const fs = require('fs');
    const path = require('path');
    
    // Шлях до файлу балансів користувача
    const balancesFile = path.join(__dirname, '..', 'database', `user_balances_${userAddress}.json`);
    
    // Читаємо поточні баланси
    let userBalances = {};
    if (fs.existsSync(balancesFile)) {
      const data = fs.readFileSync(balancesFile, 'utf8');
      userBalances = JSON.parse(data);
    }
    
    // Оновлюємо баланс
    const currentBalance = parseFloat(userBalances[token] || 0);
    const changeAmount = parseFloat(amount);
    let newBalance;
    
    if (operation === 'add') {
      newBalance = currentBalance + changeAmount;
    } else if (operation === 'subtract') {
      newBalance = Math.max(0, currentBalance - changeAmount);
    } else if (operation === 'set') {
      newBalance = changeAmount;
    } else {
      return res.status(400).json({ error: 'Invalid operation' });
    }
    
    userBalances[token] = newBalance;
    
    // Зберігаємо оновлені баланси
    fs.writeFileSync(balancesFile, JSON.stringify(userBalances, null, 2));
    
    console.log(`✅ Updated balance for user ${userAddress}: ${token} ${currentBalance} → ${newBalance} (${operation} ${changeAmount})`);
    
    res.json({ success: true, newBalance });
    
  } catch (error) {
    console.error('❌ Error updating user balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    bot: 'running',
    timestamp: new Date().toISOString(),
    requestsInMemory: withdrawalRequests.size
  });
});

// Запускаємо сервер
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🤖 Telegram bot server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Admin Server: ${ADMIN_SERVER_URL}`);
  console.log(`📱 Bot is ready! Send /start to test.`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  bot.stopPolling();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  bot.stopPolling();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Обробка необроблених помилок
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  bot.stopPolling();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = { bot, withdrawalRequests };
