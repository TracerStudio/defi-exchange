const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fetch = require('node-fetch');
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

// Функція для оновлення балансів користувача через API
const updateUserBalances = async (userAddress, token, amount) => {
  try {
    console.log(`🤖 Updating balance via API: ${userAddress}, ${token}, -${amount}`);
    console.log(`🌐 API URL: ${ADMIN_SERVER_URL}/api/update-balance-from-bot`);
    
    const requestBody = {
      userAddress: userAddress,
      token: token,
      amount: amount,
      operation: 'subtract'
    };
    
    console.log(`📤 Request body:`, requestBody);
    
    const response = await fetch(`${ADMIN_SERVER_URL}/api/update-balance-from-bot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`📡 API Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error Response:`, errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`✅ Balance updated via API:`, result);
    
    return result.newBalance;
    
  } catch (error) {
    console.error('❌ Error updating user balance via API:', error);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
};

// Webhook endpoint
app.post(`/webhook/${BOT_TOKEN}`, (req, res) => {
  console.log(`📨 Webhook received:`, {
    updateId: req.body.update_id,
    messageType: req.body.message ? 'message' : req.body.callback_query ? 'callback_query' : 'other',
    from: req.body.message?.from?.username || req.body.callback_query?.from?.username || 'unknown',
    data: req.body.callback_query?.data || 'no data'
  });
  
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Обробка заявок на вивід
app.post('/withdrawal-request', async (req, res) => {
  try {
    console.log(`📥 Withdrawal request received:`, req.body);
    
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
  
  console.log(`🤖 Callback query received:`, {
    data: data,
    from: callbackQuery.from.username || callbackQuery.from.first_name,
    messageId: callbackQuery.message?.message_id
  });
  
  if (data.startsWith('approve_')) {
    const requestId = data.replace('approve_', '');
    console.log(`✅ APPROVE button clicked for request: ${requestId}`);
    
    const request = withdrawalRequests.get(requestId);
    
    if (request) {
      console.log(`📋 Request found:`, {
        id: request.id,
        userAddress: request.userAddress,
        token: request.token,
        amount: request.amount,
        address: request.address,
        status: request.status
      });
      
      // Оновлюємо статус заявки
      request.status = 'approved';
      withdrawalRequests.set(requestId, request);
      console.log(`📝 Request status updated to: approved`);
      
      // Зберігаємо статус в базу даних через API
      try {
        const statusUpdateResponse = await fetch(`${ADMIN_SERVER_URL}/api/update-withdrawal-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestId: requestId,
            status: 'approved'
          })
        });
        
        if (statusUpdateResponse.ok) {
          console.log(`✅ Withdrawal status saved to database: ${requestId}`);
        } else {
          console.error(`❌ Failed to save withdrawal status to database: ${statusUpdateResponse.status}`);
        }
      } catch (error) {
        console.error('❌ Error saving withdrawal status to database:', error);
      }
      
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
        console.log(`🔄 Starting balance update process...`);
        console.log(`📊 Update details:`, {
          userAddress: request.userAddress,
          token: request.token,
          amount: request.amount,
          operation: 'subtract'
        });
        
        // Тестуємо зв'язок з сервером
        console.log(`🧪 Testing connection to admin server...`);
        try {
          const testResponse = await fetch(`${ADMIN_SERVER_URL}/api/bot-test`);
          if (testResponse.ok) {
            const testResult = await testResponse.json();
            console.log(`✅ Server connection test successful:`, testResult);
          } else {
            console.error(`❌ Server connection test failed: ${testResponse.status}`);
          }
        } catch (testError) {
          console.error(`❌ Server connection test error:`, testError);
        }
        
        const result = await updateUserBalances(request.userAddress, request.token, request.amount);
        
        console.log(`✅ Withdrawal approved: ${requestId}`);
        console.log(`💰 User ${request.userAddress} balance updated: -${request.amount} ${request.token}`);
        console.log(`📍 User should receive ${request.amount} ${request.token} to ${request.address}`);
        console.log(`📈 Balance update result:`, result);
        
      } catch (balanceError) {
        console.error('❌ Error updating user balance:', balanceError);
        console.error('❌ Error details:', {
          message: balanceError.message,
          stack: balanceError.stack,
          requestId: requestId,
          userAddress: request.userAddress,
          token: request.token,
          amount: request.amount
        });
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
  
  // Спочатку перевіряємо в пам'яті
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
  
  // Якщо не знайдено в пам'яті, перевіряємо в базі даних
  try {
    console.log(`🔍 Request not found in memory, checking database for: ${requestId}`);
    console.log(`🌐 Database URL: ${ADMIN_SERVER_URL}/api/withdrawal-requests/${requestId}`);
    const response = await fetch(`${ADMIN_SERVER_URL}/api/withdrawal-requests/${requestId}`);
    
    console.log(`📡 Database response status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const dbRequest = await response.json();
      console.log(`✅ Found request in database: ${requestId}, status: ${dbRequest.status}`);
      console.log(`📊 Database request details:`, dbRequest);
      res.json({
        requestId: requestId,
        status: dbRequest.status,
        token: dbRequest.token,
        amount: dbRequest.amount,
        address: dbRequest.address,
        userAddress: dbRequest.userAddress
      });
      return;
    } else {
      const errorText = await response.text();
      console.error(`❌ Database request failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error(`❌ Error checking database for request ${requestId}:`, error);
    console.error(`❌ Error details:`, error.message);
  }
  
  console.log(`❌ Request not found in memory or database: ${requestId}`);
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
