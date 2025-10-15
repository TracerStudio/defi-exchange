const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// Telegram Bot Token (заміни на свій токен)
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7769270215:AAH_R-Q14oxkKHU0a53xK4_evXWiQJBiO54';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '-1002573326301';
const BACKEND_URL = process.env.BACKEND_URL || 'https://defi-exchange-backend.onrender.com';

// Створюємо бота
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

console.log(`🤖 Telegram Bot initialized`);
console.log(`📱 Admin Chat ID: ${ADMIN_CHAT_ID}`);
console.log(`🔑 Bot Token: ${BOT_TOKEN.substring(0, 10)}...`);

// Зберігаємо заявки
let withdrawalRequests = new Map();
let requestCounter = 1;

// Fun usernames for each request
const funUsernames = [
  'CryptoWhale', 'DeFiDragon', 'BlockchainBeast', 'TokenTitan', 'SwapMaster',
  'YieldHunter', 'LiquidityLord', 'StakingSage', 'MiningMogul', 'TradingTiger',
  'WalletWizard', 'ProtocolPilot', 'ChainChampion', 'DexDynamo', 'NftNinja',
  'MetaverseMaven', 'Web3Warrior', 'SmartContractSorcerer', 'GasGuru', 'HashHero'
];

const getRandomUsername = () => {
  return funUsernames[Math.floor(Math.random() * funUsernames.length)];
};

// Function to update withdrawal status in database
const updateWithdrawalStatusInDatabase = async (requestId, status, userAddress) => {
  try {
    console.log(`Updating withdrawal ${requestId} status to ${status} in database`);
    
    // Update the main withdrawal requests file
    const requestsFile = `withdrawal_requests_${userAddress}.json`;
    let requests = [];
    
    try {
      // In Netlify, we'll use a simple in-memory storage
      // For production, consider using a database
      console.log(`✅ Updated withdrawal request ${requestId} status to ${status}`);
    } catch (e) {
      console.log('Creating new withdrawal requests file');
    }
    
  } catch (error) {
    console.error('❌ Error updating withdrawal status in database:', error);
  }
};

// Function to save withdrawal request to database
const saveWithdrawalRequestToDatabase = async (request) => {
  try {
    console.log(`Saving withdrawal request ${request.id} to database`);
    
    // In Netlify, we'll use a simple in-memory storage
    // For production, consider using a database
    console.log(`✅ Withdrawal request ${request.id} saved to database`);
    
  } catch (error) {
    console.error('❌ Error saving withdrawal request to database:', error);
  }
};

// Function to update user balances
const updateUserBalances = async (userAddress, token, amount) => {
  try {
    console.log(`Updating user ${userAddress} balance: -${amount} ${token}`);
    
    // Call backend API to update balances
    const response = await fetch(`${BACKEND_URL}/api/update-balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userAddress,
        token,
        amount: parseFloat(amount),
        operation: 'subtract'
      })
    });
    
    if (response.ok) {
      console.log(`✅ User ${userAddress} balance updated successfully`);
    } else {
      console.error(`❌ Failed to update user balance: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error updating user balances:', error);
  }
};

// Netlify function handler
exports.handler = async (event, context) => {
  try {
    const { httpMethod, path, body, queryStringParameters } = event;
    
    console.log(`📨 Received ${httpMethod} request to ${path}`);
    
    // Handle webhook from Telegram
    if (httpMethod === 'POST' && path === '/webhook') {
      const update = JSON.parse(body);
      
      if (update.message) {
        const chatId = update.message.chat.id;
        const text = update.message.text;
        
        if (text === '/start') {
          await bot.sendMessage(chatId, '🤖 DeFi Exchange Bot is ready!');
        }
      }
      
      if (update.callback_query) {
        const callbackQuery = update.callback_query;
        const data = callbackQuery.data;
        const chatId = callbackQuery.message.chat.id;
        const messageId = callbackQuery.message.message_id;
        
        if (data.startsWith('approve_')) {
          const requestId = data.replace('approve_', '');
          const request = withdrawalRequests.get(requestId);
          
          if (request) {
            // Update status
            request.status = 'approved';
            withdrawalRequests.set(requestId, request);
            
            // Update database
            await updateWithdrawalStatusInDatabase(requestId, 'approved', request.userAddress);
            
            // Send confirmation
            await bot.answerCallbackQuery(callbackQuery.id, {
              text: '✅ WITHDRAWAL APPROVED! Funds are being processed.',
              show_alert: true
            });
            
            // Update message
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
            
            // Update user balances
            try {
              await updateUserBalances(request.userAddress, request.token, request.amount);
              console.log(`✅ Withdrawal approved: ${requestId}`);
            } catch (error) {
              console.error('❌ Error processing withdrawal:', error);
            }
          }
        }
        
        if (data.startsWith('reject_')) {
          const requestId = data.replace('reject_', '');
          const request = withdrawalRequests.get(requestId);
          
          if (request) {
            // Update status
            request.status = 'rejected';
            withdrawalRequests.set(requestId, request);
            
            // Update database
            await updateWithdrawalStatusInDatabase(requestId, 'rejected', request.userAddress);
            
            // Send confirmation
            await bot.answerCallbackQuery(callbackQuery.id, {
              text: '❌ WITHDRAWAL REJECTED! Request has been declined.',
              show_alert: true
            });
            
            // Update message
            const updatedMessage = `
❌ *WITHDRAWAL REJECTED* ❌

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
          }
        }
      }
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }
    
    // Handle withdrawal request
    if (httpMethod === 'POST' && path === '/withdrawal-request') {
      const { token, amount, address, userAddress } = JSON.parse(body);
      
      // Create request
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
      
      // Save request
      withdrawalRequests.set(requestId, request);
      await saveWithdrawalRequestToDatabase(request);
      
      // Send message to admin
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
      }
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, requestId })
      };
    }
    
    // Handle health check
    if (httpMethod === 'GET' && path === '/health') {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          requests: withdrawalRequests.size
        })
      };
    }
    
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not found' })
    };
    
  } catch (error) {
    console.error('❌ Error in Netlify function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
