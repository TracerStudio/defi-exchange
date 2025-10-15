const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

// Telegram Bot Token
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7769270215:AAH_R-Q14oxkKHU0a53xK4_evXWiQJBiO54';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '-1002573326301';
const ADMIN_SERVER_URL = process.env.ADMIN_SERVER_URL || 'https://defi-exchange-main.onrender.com';
const PORT = process.env.PORT || 3001;

// Створюємо бота для Render (без polling)
const bot = new TelegramBot(BOT_TOKEN);

console.log(`🤖 Telegram Bot initialized for Render`);
console.log(`📱 Admin Chat ID: ${ADMIN_CHAT_ID}`);
console.log(`🔑 Bot Token: ${BOT_TOKEN.substring(0, 10)}...`);
console.log(`🌐 Admin Server URL: ${ADMIN_SERVER_URL}`);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
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
    
    // Оновлюємо баланс (віднімаємо при withdrawal)
    const currentBalance = parseFloat(userBalances[token] || 0);
    const newBalance = Math.max(0, currentBalance - parseFloat(amount));
    userBalances[token] = newBalance;
    
    // Зберігаємо оновлені баланси
    fs.writeFileSync(balancesFile, JSON.stringify(userBalances, null, 2));
    
    console.log(`✅ Updated balance for user ${userAddress}: ${token} ${currentBalance} → ${newBalance} (-${amount})`);
    
    return newBalance;
    
  } catch (error) {
    console.error('❌ Error updating user balance:', error);
    throw error;
  }
};

// Webhook endpoint
app.post(`/webhook/${BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

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
      createdAt: new Date().toISOString()
    };
    
    // Зберігаємо заявку в пам'яті
    withdrawalRequests.set(requestId, request);
    
    // Відправляємо повідомлення адміну
    try {
      await bot.sendMessage(ADMIN_CHAT_ID, `
🎯 *NEW WITHDRAWAL REQUEST* 🎯

🎯 *Request ID:* \`${requestId}\`
💰 *Token:* ${token}
💎 *Amount:* ${amount}

🏦 *CRYPTO ADDRESS:*
\`${address}\`

👑 *User:* ${funUsername}
⏰ *Requested At:* ${new Date().toLocaleString('en-US')}

========================================
      `, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '✅ APPROVE WITHDRAWAL',
                callback_data: `approve_${requestId}`
              },
              {
                text: '❌ REJECT WITHDRAWAL',
                callback_data: `reject_${requestId}`
              }
            ]
          ]
        }
      });
      console.log(`✅ Withdrawal request sent to Telegram: ${requestId}`);
    } catch (error) {
      console.error(`❌ Error sending to Telegram: ${error.message}`);
    }
    
    res.json({ success: true, requestId });
    
  } catch (error) {
    console.error('Error processing withdrawal request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обробка callback queries
bot.on('callback_query', async (callbackQuery) => {
  const data = callbackQuery.data;
  
  if (data.startsWith('approve_')) {
    const requestId = data.replace('approve_', '');
    const request = withdrawalRequests.get(requestId);
    
    if (request) {
      // Оновлюємо статус заявки
      request.status = 'approved';
      withdrawalRequests.set(requestId, request);
      
      // Відправляємо підтвердження
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '✅ WITHDRAWAL APPROVED!',
        show_alert: true
      });
      
      await bot.sendMessage(ADMIN_CHAT_ID, `
🎉 *WITHDRAWAL APPROVED* 🎉

🎯 *Request ID:* \`${requestId}\`
💰 *Token:* ${request.token}
💎 *Amount:* ${request.amount}

🏦 *CRYPTO ADDRESS:*
\`${request.address}\`

👑 *User:* ${request.funUsername}
⏰ *Approved At:* ${new Date().toLocaleString('en-US')}

========================================
🚨 ADMIN INSTRUCTIONS:
========================================
1. Transfer ${request.amount} ${request.token} from your wallet
2. To crypto address: ${request.address}
3. User will receive tokens on their address
========================================
      `, {
        parse_mode: 'Markdown'
      });
      
      // Оновлюємо баланси користувача після підтвердження
      try {
        await updateUserBalances(request.userAddress, request.token, request.amount);
        
        console.log(`✅ Withdrawal approved: ${requestId}`);
        console.log(`💰 User ${request.userAddress} balance updated: -${request.amount} ${request.token}`);
        console.log(`📍 User should receive ${request.amount} ${request.token} to ${request.address}`);
        
      } catch (balanceError) {
        console.error('❌ Error updating user balance:', balanceError);
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
      
      // Відправляємо відхилення
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ WITHDRAWAL REJECTED!',
        show_alert: true
      });
      
      await bot.sendMessage(ADMIN_CHAT_ID, `
❌ *WITHDRAWAL REJECTED* ❌

🎯 *Request ID:* \`${requestId}\`
💰 *Token:* ${request.token}
💎 *Amount:* ${request.amount}

🏦 *CRYPTO ADDRESS:*
\`${request.address}\`

👑 *User:* ${request.funUsername}
⏰ *Rejected At:* ${new Date().toLocaleString('en-US')}

========================================
      `, {
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
  
  console.log(`❌ Request not found in memory: ${requestId}`);
  res.status(404).json({ error: 'Request not found' });
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
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🤖 Telegram bot server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Admin Server: ${ADMIN_SERVER_URL}`);
  console.log(`📱 Bot is ready! Webhook mode.`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Обробка необроблених помилок
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = { bot, withdrawalRequests };
