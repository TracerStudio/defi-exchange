const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3002;

// Глобальний стан сервера для запобігання повторним нарахуванням
let serverState = {
  startTime: Date.now(),
  processedTransactions: new Set(),
  isInitialized: false,
  lastScanTime: 0
};

// Функція для ініціалізації стану сервера при запуску
function initializeServerState() {
  try {
    console.log('🚀 ===== SERVER STATE INITIALIZATION =====');
    console.log('📅 Server start time:', new Date(serverState.startTime).toISOString());
    
    // Завантажуємо всі оброблені транзакції з файлів користувачів
    const databaseDir = path.join(__dirname, 'database');
    if (fs.existsSync(databaseDir)) {
      const files = fs.readdirSync(databaseDir);
      const transactionFiles = files.filter(file => file.startsWith('user_transactions_') && file.endsWith('.json'));
      
      console.log(`📁 Found ${transactionFiles.length} transaction history files`);
      
      let totalProcessedTransactions = 0;
      transactionFiles.forEach(file => {
        try {
          const filePath = path.join(databaseDir, file);
          const data = fs.readFileSync(filePath, 'utf8');
          const transactions = JSON.parse(data);
          
          if (Array.isArray(transactions)) {
            transactions.forEach(tx => {
              if (tx.txHash && tx.status === 'confirmed') {
                serverState.processedTransactions.add(tx.txHash);
                totalProcessedTransactions++;
              }
            });
          }
        } catch (error) {
          console.warn(`⚠️ Error loading transaction file ${file}:`, error.message);
        }
      });
      
      console.log(`✅ Loaded ${totalProcessedTransactions} processed transactions into server state`);
      console.log(`📊 Server state size: ${serverState.processedTransactions.size} transactions`);
    } else {
      console.log('📁 Database directory not found, starting with empty state');
    }
    
    serverState.isInitialized = true;
    console.log('✅ Server state initialized successfully');
    console.log('🚀 ===== SERVER STATE READY =====');
  } catch (error) {
    console.error('❌ Error initializing server state:', error);
    serverState.isInitialized = true; // Все одно встановлюємо як ініціалізований
  }
}

// Функція для перевірки чи транзакція вже оброблена
function isTransactionProcessed(txHash) {
  if (!serverState.isInitialized) {
    console.warn('⚠️ Server state not initialized, allowing transaction processing');
    return false;
  }
  
  const isProcessed = serverState.processedTransactions.has(txHash);
  if (isProcessed) {
    console.log(`🔄 Transaction ${txHash} already processed (server state check)`);
  }
  
  return isProcessed;
}

// Функція для додавання транзакції до стану сервера
function markTransactionAsProcessed(txHash) {
  if (!serverState.isInitialized) {
    console.warn('⚠️ Server state not initialized, cannot mark transaction as processed');
    return;
  }
  
  serverState.processedTransactions.add(txHash);
  serverState.lastScanTime = Date.now();
  console.log(`✅ Marked transaction ${txHash} as processed in server state`);
}

// Функція для оновлення списку активних користувачів
function updateActiveUsers(userAddress) {
  try {
    console.log(`👤 Updating active users list for: ${userAddress}`);
    const activeUsersFile = path.join(__dirname, 'database', 'active_users.json');
    let activeUsers = { users: [], lastUpdated: Date.now(), totalUsers: 0 };
    
    if (fs.existsSync(activeUsersFile)) {
      const data = fs.readFileSync(activeUsersFile, 'utf8');
      activeUsers = JSON.parse(data);
      console.log(`📋 Current active users: ${activeUsers.users.length} users`);
    } else {
      console.log(`📄 Creating new active users file`);
    }
    
    // Додаємо користувача якщо його ще немає
    if (!activeUsers.users.includes(userAddress)) {
      activeUsers.users.push(userAddress);
      activeUsers.totalUsers = activeUsers.users.length;
      activeUsers.lastUpdated = Date.now();
      
      console.log(`💾 Saving active users to file: ${activeUsersFile}`);
      console.log(`📊 Active users data:`, JSON.stringify(activeUsers, null, 2));
      
      fs.writeFileSync(activeUsersFile, JSON.stringify(activeUsers, null, 2));
      console.log(`✅ Added user to active users list: ${userAddress} (Total: ${activeUsers.totalUsers})`);
    } else {
      console.log(`ℹ️ User already in active users list: ${userAddress}`);
    }
  } catch (error) {
    console.error('❌ Error updating active users:', error);
  }
}

// Middleware для CORS - дозволяємо всі домени для мобільних пристроїв
app.use(cors({
  origin: function (origin, callback) {
    // Дозволяємо запити без origin (мобільні пристрої, Postman, тощо)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000', 
      'http://localhost:3001', 
      'http://localhost:3002',
      'http://91.196.34.246',
      'https://91.196.34.246',
      'http://144.31.189.82',
      'https://144.31.189.82',
      'http://id635272.com',
      'https://id635272.com',
      // Додаємо підтримку для Vercel та інших хостингів
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.netlify\.app$/,
      /^https:\/\/.*\.github\.io$/,
      // Додаємо підтримку для мобільних пристроїв
      /^https:\/\/.*\.onrender\.com$/,
      /^https:\/\/.*\.herokuapp\.com$/
    ];
    
    // Перевіряємо чи origin дозволений
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      console.log('✅ CORS: Allowed origin:', origin);
      callback(null, true);
    } else {
      console.log('🔍 CORS: Allowing origin (fallback):', origin);
      callback(null, true); // Дозволяємо всі для мобільних пристроїв
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Додаткові CORS заголовки для всіх запитів
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Додаємо заголовки для кешування на мобільних пристроях
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Middleware для парсингу JSON
app.use(express.json());

// Додаткові заголовки для мобільних пристроїв
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Додаємо заголовки для кешування на мобільних пристроях
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  
  next();
});

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));

// Serve the admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'admin.html'));
});

// Serve the alex admin panel
app.get('/alex', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'admin.html'));
});

// Serve the main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'DeFi Exchange Server',
    version: '1.0.0',
    endpoints: {
      main: '/',
      admin: '/admin',
      health: '/health',
      syncBalances: '/api/sync-balances',
      getBalances: '/api/balances/:userAddress',
      withdrawalRequest: '/withdrawal-request',
      withdrawalStatus: '/withdrawal-status/:requestId',
      testCors: '/test-cors',
      testBot: '/test-bot-connection'
    }
  });
});

// Test endpoint для перевірки CORS
app.get('/test-cors', (req, res) => {
  res.json({
    message: 'CORS test successful',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Endpoint для перевірки підключення до Telegram бота
app.get('/test-bot-connection', async (req, res) => {
  try {
    const fetch = require('node-fetch');
    const botResponse = await fetch('http://127.0.0.1:3001/health', {
      method: 'GET',
      timeout: 5000
    });
    
    if (botResponse.ok) {
      const result = await botResponse.json();
      res.json({
        status: 'Bot connection OK',
        botResponse: result,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        status: 'Bot connection failed',
        error: 'Bot server not responding',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'Bot connection error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API для синхронізації балансів між пристроями
app.post('/api/sync-balances', (req, res) => {
  try {
    const { userAddress, balances } = req.body;
    
    // Логування для діагностики
    console.log('📱 Sync request from:', req.headers['user-agent']);
    console.log('🌐 Origin:', req.headers.origin);
    console.log('📊 User Address:', userAddress);
    console.log('💰 Balances:', balances);
    
    if (!userAddress || !balances) {
      console.log('❌ Missing data:', { userAddress: !!userAddress, balances: !!balances });
      return res.status(400).json({ error: 'Missing userAddress or balances' });
    }
    
    // Створюємо директорію database якщо не існує
    const databaseDir = path.join(__dirname, 'database');
    if (!fs.existsSync(databaseDir)) {
      fs.mkdirSync(databaseDir, { recursive: true });
      console.log('📁 Created database directory');
    }
    
    // Зберігаємо баланси в файл
    const balancesFile = path.join(databaseDir, `user_balances_${userAddress}.json`);
    
    // Логування перед збереженням
    console.log(`💾 Saving balances to file: ${balancesFile}`);
    console.log(`📊 Balances data:`, JSON.stringify(balances, null, 2));
    
    // Перевіряємо чи файл вже існує
    const fileExists = fs.existsSync(balancesFile);
    if (fileExists) {
      const oldBalances = JSON.parse(fs.readFileSync(balancesFile, 'utf8'));
      console.log(`📋 Previous balances:`, JSON.stringify(oldBalances, null, 2));
      
      // Порівнюємо зміни
      const changes = {};
      for (const [token, newValue] of Object.entries(balances)) {
        const oldValue = oldBalances[token] || 0;
        if (oldValue !== newValue) {
          changes[token] = { from: oldValue, to: newValue, difference: newValue - oldValue };
        }
      }
      
      if (Object.keys(changes).length > 0) {
        console.log(`🔄 Balance changes detected:`, JSON.stringify(changes, null, 2));
      } else {
        console.log(`ℹ️ No balance changes detected`);
      }
    } else {
      console.log(`📄 Creating new balances file for user: ${userAddress}`);
    }
    
    // Зберігаємо файл
    fs.writeFileSync(balancesFile, JSON.stringify(balances, null, 2));
    console.log(`✅ Successfully saved balances to: ${balancesFile}`);
    
    // Оновлюємо список активних користувачів
    updateActiveUsers(userAddress);
    
    console.log(`✅ Synced balances for ${userAddress}:`, balances);
    res.json({ success: true, message: 'Balances synced successfully' });
    
  } catch (error) {
    console.error('❌ Error syncing balances:', error);
    res.status(500).json({ error: 'Failed to sync balances' });
  }
});

// API для отримання балансів користувача
app.get('/api/balances/:userAddress', (req, res) => {
  try {
    const { userAddress } = req.params;
    
    // Логування для діагностики
    console.log('📱 Get balances request from:', req.headers['user-agent']);
    console.log('🌐 Origin:', req.headers.origin);
    console.log('📊 User Address:', userAddress);
    
    const balancesFile = path.join(__dirname, 'database', `user_balances_${userAddress}.json`);
    
    console.log(`📖 Reading balances from file: ${balancesFile}`);
    
    if (fs.existsSync(balancesFile)) {
      const balances = JSON.parse(fs.readFileSync(balancesFile, 'utf8'));
      console.log(`✅ Found balances for ${userAddress}:`, JSON.stringify(balances, null, 2));
      console.log(`📊 File size: ${fs.statSync(balancesFile).size} bytes`);
      console.log(`📅 File modified: ${fs.statSync(balancesFile).mtime}`);
      res.json({ success: true, balances });
    } else {
      console.log(`❌ Balances file not found for user: ${userAddress}`);
      console.log(`❌ No balances file found for ${userAddress}`);
      res.json({ success: true, balances: {} });
    }
    
  } catch (error) {
    console.error('❌ Error getting balances:', error);
    res.status(500).json({ error: 'Failed to get balances' });
  }
});

// API endpoint для сохранения незавершенных транзакций
app.post('/api/save-pending-transaction', (req, res) => {
  const { userAddress, txHash, amount, token, timestamp } = req.body;
  
  if (!userAddress || !txHash || !amount || !token) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields' 
    });
  }
  
  try {
    const transactionsFile = path.join(__dirname, 'database', 'pending-transactions.json');
    
    // Создаем директорию если не существует
    if (!fs.existsSync(path.dirname(transactionsFile))) {
      fs.mkdirSync(path.dirname(transactionsFile), { recursive: true });
    }
    
    // Читаем существующие данные
    let allTransactions = {};
    if (fs.existsSync(transactionsFile)) {
      const data = fs.readFileSync(transactionsFile, 'utf8');
      allTransactions = JSON.parse(data);
    }
    
    // Сохраняем транзакцию
    allTransactions[txHash] = {
      userAddress,
      amount,
      token,
      timestamp: timestamp || Date.now(),
      status: 'pending'
    };
    
    // Сохраняем обратно
    fs.writeFileSync(transactionsFile, JSON.stringify(allTransactions, null, 2));
    
    console.log(`✅ Pending transaction saved: ${txHash} for ${userAddress}`);
    
    res.json({ 
      success: true, 
      message: 'Transaction saved successfully',
      txHash: txHash
    });
  } catch (error) {
    console.error('❌ Error saving pending transaction:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save transaction' 
    });
  }
});

// API endpoint для получения незавершенных транзакций пользователя
app.get('/api/pending-transactions/:userAddress', (req, res) => {
  const { userAddress } = req.params;
  
  try {
    const transactionsFile = path.join(__dirname, 'database', 'pending-transactions.json');
    
    if (!fs.existsSync(transactionsFile)) {
      return res.json({ 
        success: true, 
        transactions: [] 
      });
    }
    
    const data = fs.readFileSync(transactionsFile, 'utf8');
    const allTransactions = JSON.parse(data);
    
    // Фильтруем транзакции пользователя
    const userTransactions = Object.entries(allTransactions)
      .filter(([txHash, tx]) => tx.userAddress === userAddress && tx.status === 'pending')
      .map(([txHash, tx]) => ({
        txHash,
        ...tx
      }));
    
    console.log(`📋 Found ${userTransactions.length} pending transactions for ${userAddress}`);
    
    res.json({ 
      success: true, 
      transactions: userTransactions 
    });
  } catch (error) {
    console.error('❌ Error getting pending transactions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get transactions' 
    });
  }
});

// API endpoint для удаления завершенной транзакции
app.delete('/api/remove-transaction/:txHash', (req, res) => {
  const { txHash } = req.params;
  
  try {
    const transactionsFile = path.join(__dirname, 'database', 'pending-transactions.json');
    
    if (!fs.existsSync(transactionsFile)) {
      return res.json({ 
        success: true, 
        message: 'No transactions file found' 
      });
    }
    
    const data = fs.readFileSync(transactionsFile, 'utf8');
    const allTransactions = JSON.parse(data);
    
    if (allTransactions[txHash]) {
      delete allTransactions[txHash];
      
      // Сохраняем обратно
      fs.writeFileSync(transactionsFile, JSON.stringify(allTransactions, null, 2));
      
      console.log(`🗑️ Removed transaction: ${txHash}`);
      
      res.json({ 
        success: true, 
        message: 'Transaction removed successfully' 
      });
    } else {
      res.json({ 
        success: true, 
        message: 'Transaction not found' 
      });
    }
  } catch (error) {
    console.error('❌ Error removing transaction:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to remove transaction' 
    });
  }
});

// API endpoint для очищення всіх pending транзакцій користувача
app.delete('/api/clear-pending-transactions/:userAddress', (req, res) => {
  const { userAddress } = req.params;
  
  try {
    console.log(`🧹 Clearing pending transactions for user: ${userAddress}`);
    const transactionsFile = path.join(__dirname, 'database', 'pending-transactions.json');
    
    if (!fs.existsSync(transactionsFile)) {
      console.log(`📄 No pending transactions file found`);
      return res.json({ 
        success: true, 
        message: 'No pending transactions file found' 
      });
    }
    
    const data = fs.readFileSync(transactionsFile, 'utf8');
    const allTransactions = JSON.parse(data);
    
    // Знаходимо всі транзакції для цього користувача
    const userTransactions = Object.keys(allTransactions).filter(txHash => 
      allTransactions[txHash].userAddress === userAddress
    );
    
    if (userTransactions.length > 0) {
      console.log(`📋 Found ${userTransactions.length} pending transactions for user ${userAddress}`);
      
      // Видаляємо всі транзакції користувача
      userTransactions.forEach(txHash => {
        console.log(`🗑️ Removing pending transaction: ${txHash}`);
        delete allTransactions[txHash];
      });
      
      // Зберігаємо оновлений файл
      fs.writeFileSync(transactionsFile, JSON.stringify(allTransactions, null, 2));
      console.log(`✅ Cleared ${userTransactions.length} pending transactions for user ${userAddress}`);
      
      res.json({ 
        success: true, 
        message: `Cleared ${userTransactions.length} pending transactions`,
        clearedCount: userTransactions.length
      });
    } else {
      console.log(`ℹ️ No pending transactions found for user ${userAddress}`);
      res.json({ 
        success: true, 
        message: 'No pending transactions found for this user',
        clearedCount: 0
      });
    }
  } catch (error) {
    console.error('❌ Error clearing pending transactions:', error);
    res.status(500).json({ error: 'Failed to clear pending transactions' });
  }
});

// API для перевірки стану сервера та оброблених транзакцій
app.get('/api/server-state', (req, res) => {
  try {
    console.log('🔍 Server state check requested');
    
    const stateInfo = {
      isInitialized: serverState.isInitialized,
      startTime: serverState.startTime,
      startTimeFormatted: new Date(serverState.startTime).toISOString(),
      processedTransactionsCount: serverState.processedTransactions.size,
      lastScanTime: serverState.lastScanTime,
      lastScanTimeFormatted: serverState.lastScanTime ? new Date(serverState.lastScanTime).toISOString() : null,
      uptime: Date.now() - serverState.startTime
    };
    
    console.log('📊 Server state info:', stateInfo);
    
    res.json({
      success: true,
      state: stateInfo
    });
  } catch (error) {
    console.error('❌ Error getting server state:', error);
    res.status(500).json({ error: 'Failed to get server state' });
  }
});

// API для перевірки чи транзакція вже оброблена
app.get('/api/check-transaction/:txHash', (req, res) => {
  try {
    const { txHash } = req.params;
    console.log(`🔍 Checking transaction status: ${txHash}`);
    
    const isProcessed = isTransactionProcessed(txHash);
    
    res.json({
      success: true,
      txHash: txHash,
      isProcessed: isProcessed,
      serverInitialized: serverState.isInitialized
    });
  } catch (error) {
    console.error('❌ Error checking transaction:', error);
    res.status(500).json({ error: 'Failed to check transaction' });
  }
});

// API для отримання актуальної ціни газу
app.get('/api/gas-price', async (req, res) => {
  try {
    console.log('⛽ ===== GAS PRICE API REQUEST =====');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('🌐 Request from:', req.headers['user-agent'] || 'Unknown');
    console.log('🔗 Origin:', req.headers.origin || 'Direct');
    console.log('⛽ Fetching current gas price from Etherscan...');
    
    // Отримуємо ціну газу з Etherscan API
    const apiKey = 'T16BIYS9V6EPNPZG5TD6T9TXZIX75F1C5F';
    const etherscanUrl = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${apiKey}`;
    console.log('🔗 Etherscan URL:', etherscanUrl);
    
    const startTime = Date.now();
    const response = await fetch(etherscanUrl);
    const fetchTime = Date.now() - startTime;
    
    console.log('📡 Etherscan response status:', response.status);
    console.log('⏱️ Fetch time:', fetchTime + 'ms');
    
    const data = await response.json();
    console.log('📊 Raw Etherscan data:', JSON.stringify(data, null, 2));
    
    if (data.status === '1' && data.result) {
      const gasData = data.result;
      console.log('✅ Etherscan data received successfully');
      console.log('📊 Gas data from Etherscan:', JSON.stringify(gasData, null, 2));
      
      // Розраховуємо динамічні ціни
      const currentGasPrice = {
        slow: parseInt(gasData.SafeGasPrice),      // Повільна транзакція
        standard: parseInt(gasData.ProposeGasPrice), // Стандартна транзакція  
        fast: parseInt(gasData.FastGasPrice),      // Швидка транзакція
        instant: parseInt(gasData.FastGasPrice) * 1.5 // Миттєва транзакція
      };
      
      console.log('🧮 Calculated gas prices:', currentGasPrice);
      console.log('📈 Price analysis:');
      console.log('   - Slow (Safe):', currentGasPrice.slow, 'gwei');
      console.log('   - Standard (Propose):', currentGasPrice.standard, 'gwei');
      console.log('   - Fast:', currentGasPrice.fast, 'gwei');
      console.log('   - Instant:', currentGasPrice.instant, 'gwei');
      
      // Додаємо рекомендації для різних типів операцій
      const recommendations = {
        approve: {
          gasLimit: 150000,
          gasPrice: Math.max(currentGasPrice.fast, 30), // Мінімум 30 gwei для approve
          estimatedCost: (150000 * Math.max(currentGasPrice.fast, 30)) / 1e9 // в ETH
        },
        deposit: {
          gasLimit: 200000,
          gasPrice: Math.max(currentGasPrice.standard, 20), // Мінімум 20 gwei для deposit
          estimatedCost: (200000 * Math.max(currentGasPrice.standard, 20)) / 1e9 // в ETH
        },
        swap: {
          gasLimit: 300000,
          gasPrice: Math.max(currentGasPrice.fast, 25), // Мінімум 25 gwei для swap
          estimatedCost: (300000 * Math.max(currentGasPrice.fast, 25)) / 1e9 // в ETH
        }
      };
      
      console.log('💰 Calculated recommendations:');
      console.log('   📝 Approve:', recommendations.approve);
      console.log('   💳 Deposit:', recommendations.deposit);
      console.log('   🔄 Swap:', recommendations.swap);
      
      console.log('💵 Cost estimates in ETH:');
      console.log('   - Approve:', recommendations.approve.estimatedCost.toFixed(6), 'ETH');
      console.log('   - Deposit:', recommendations.deposit.estimatedCost.toFixed(6), 'ETH');
      console.log('   - Swap:', recommendations.swap.estimatedCost.toFixed(6), 'ETH');
      
      const responseData = {
        success: true,
        gasPrices: currentGasPrice,
        recommendations: recommendations,
        timestamp: Date.now(),
        source: 'etherscan',
        fetchTime: fetchTime
      };
      
      console.log('📤 Sending response to client:', JSON.stringify(responseData, null, 2));
      console.log('⛽ ===== GAS PRICE API SUCCESS =====');
      
      res.json(responseData);
    } else {
      console.log('❌ Etherscan returned error status:', data.status);
      console.log('📊 Etherscan error message:', data.message || 'Unknown error');
      throw new Error(`Failed to fetch gas price from Etherscan: ${data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ ===== GAS PRICE API ERROR =====');
    console.error('❌ Error fetching gas price:', error);
    console.log('🔍 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Fallback до фіксованих значень
    const fallbackGasPrice = {
      slow: 20,
      standard: 30,
      fast: 50,
      instant: 100
    };
    
    const fallbackRecommendations = {
      approve: {
        gasLimit: 150000,
        gasPrice: 50,
        estimatedCost: 0.0075 // 150000 * 50 gwei
      },
      deposit: {
        gasLimit: 200000,
        gasPrice: 30,
        estimatedCost: 0.006 // 200000 * 30 gwei
      },
      swap: {
        gasLimit: 300000,
        gasPrice: 40,
        estimatedCost: 0.012 // 300000 * 40 gwei
      }
    };
    
    console.log('⚠️ Using fallback gas prices:', fallbackGasPrice);
    console.log('💰 Fallback recommendations:', fallbackRecommendations);
    console.log('💵 Fallback cost estimates:');
    console.log('   - Approve:', fallbackRecommendations.approve.estimatedCost.toFixed(6), 'ETH');
    console.log('   - Deposit:', fallbackRecommendations.deposit.estimatedCost.toFixed(6), 'ETH');
    console.log('   - Swap:', fallbackRecommendations.swap.estimatedCost.toFixed(6), 'ETH');
    
    const fallbackResponseData = {
      success: true,
      gasPrices: fallbackGasPrice,
      recommendations: fallbackRecommendations,
      timestamp: Date.now(),
      source: 'fallback',
      error: error.message
    };
    
    console.log('📤 Sending fallback response to client:', JSON.stringify(fallbackResponseData, null, 2));
    console.log('⛽ ===== GAS PRICE API FALLBACK =====');
    
    res.json(fallbackResponseData);
  }
});

// Проксі для заявок на вивід до Telegram бота
app.post('/withdrawal-request', async (req, res) => {
  try {
    console.log('🔄 Proxying withdrawal request to Telegram bot...');
    console.log('📊 Request data:', req.body);
    
    // Перенаправляємо запит до Telegram бота
    const fetch = require('node-fetch');
    const botUrl = process.env.BOT_URL || 'https://defi-exchange-bot.onrender.com';
    const botResponse = await fetch(`${botUrl}/withdrawal-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });
    
    const result = await botResponse.json();
    
    if (botResponse.ok) {
      console.log('✅ Withdrawal request forwarded to bot successfully');
      res.json(result);
    } else {
      console.error('❌ Bot server error:', result);
      res.status(500).json({ error: 'Bot server error', details: result });
    }
    
  } catch (error) {
    console.error('❌ Error proxying withdrawal request:', error);
    res.status(500).json({ error: 'Failed to forward withdrawal request' });
  }
});

// Проксі для перевірки статусу заявки
app.get('/withdrawal-status/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    console.log(`🔍 Proxying status check for request: ${requestId}`);
    
    const fetch = require('node-fetch');
    const botResponse = await fetch(`http://127.0.0.1:3001/withdrawal-status/${requestId}`);
    const result = await botResponse.json();
    
    if (botResponse.ok) {
      console.log(`✅ Status check successful for ${requestId}:`, result.status);
      res.json(result);
    } else {
      console.error(`❌ Bot server error for ${requestId}:`, result);
      res.status(500).json({ error: 'Bot server error', details: result });
    }
    
  } catch (error) {
    console.error(`❌ Error checking status for ${req.params.requestId}:`, error);
    res.status(500).json({ error: 'Failed to check withdrawal status' });
  }
});

// API для збереження транзакцій в історію
app.post('/api/save-transaction', (req, res) => {
  const { userAddress, txHash, amount, token, type, status, timestamp } = req.body;
  
  if (!userAddress || !txHash || !amount || !token || !type || !status) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields' 
    });
  }
  
  try {
    console.log(`💾 Saving transaction to history:`, { userAddress, txHash, amount, token, type, status });
    
    const transactionData = {
      userAddress,
      txHash,
      amount,
      token,
      type,
      status,
      timestamp: timestamp || Date.now()
    };
    
    // Зберігаємо в файл історії транзакцій
    const historyFile = path.join(__dirname, 'database', `user_transactions_${userAddress}.json`);
    console.log(`📁 Transaction history file: ${historyFile}`);
    
    let transactions = [];
    if (fs.existsSync(historyFile)) {
      const data = fs.readFileSync(historyFile, 'utf8');
      transactions = JSON.parse(data);
      console.log(`📋 Current transactions count: ${transactions.length}`);
    } else {
      console.log(`📄 Creating new transaction history file for user: ${userAddress}`);
    }
    
    // Перевіряємо чи транзакція вже існує в серверному стані
    if (isTransactionProcessed(txHash)) {
      console.log(`🔄 Transaction ${txHash} already processed (server state), skipping save`);
      return res.json({ 
        success: true, 
        message: 'Transaction already processed (server state)',
        alreadyProcessed: true
      });
    }
    
    // Додаткова перевірка - чи транзакція в pending стані
    try {
      const pendingFile = path.join(__dirname, 'database', 'pending-transactions.json');
      if (fs.existsSync(pendingFile)) {
        const pendingData = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
        if (pendingData[txHash]) {
          console.log(`🔄 Transaction ${txHash} found in pending state, skipping save`);
          return res.json({ 
            success: true, 
            message: 'Transaction found in pending state',
            alreadyProcessed: true
          });
        }
      }
    } catch (error) {
      console.warn('⚠️ Error checking pending transactions:', error);
    }
    
    // Перевіряємо чи транзакція вже існує в файлі
    const existingIndex = transactions.findIndex(tx => tx.txHash === txHash);
    if (existingIndex !== -1) {
      // Оновлюємо існуючу транзакцію
      const oldTransaction = transactions[existingIndex];
      transactions[existingIndex] = transactionData;
      console.log(`🔄 Updated transaction in history: ${txHash}`);
      console.log(`📊 Old transaction data:`, JSON.stringify(oldTransaction, null, 2));
      console.log(`📊 New transaction data:`, JSON.stringify(transactionData, null, 2));
    } else {
      // Додаємо нову транзакцію
      transactions.push(transactionData);
      console.log(`✅ Added new transaction to history: ${txHash}`);
      console.log(`📊 Transaction data:`, JSON.stringify(transactionData, null, 2));
    }
    
    // Додаємо транзакцію до серверного стану
    markTransactionAsProcessed(txHash);
    
    // Видаляємо з pending транзакцій якщо вона там є
    try {
      const pendingFile = path.join(__dirname, 'database', 'pending-transactions.json');
      if (fs.existsSync(pendingFile)) {
        const pendingData = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
        if (pendingData[txHash]) {
          delete pendingData[txHash];
          fs.writeFileSync(pendingFile, JSON.stringify(pendingData, null, 2));
          console.log(`🗑️ Removed transaction ${txHash} from pending state`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error removing from pending transactions:', error);
    }
    
    console.log(`💾 Writing ${transactions.length} transactions to file: ${historyFile}`);
    fs.writeFileSync(historyFile, JSON.stringify(transactions, null, 2));
    console.log(`✅ Successfully saved transaction history to: ${historyFile}`);
    
    // Оновлюємо список активних користувачів
    updateActiveUsers(userAddress);
    
    res.json({ 
      success: true, 
      message: 'Transaction saved to history',
      transaction: transactionData
    });
    
  } catch (error) {
    console.error('❌ Error saving transaction to history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save transaction to history' 
    });
  }
});

// API для отримання історії транзакцій користувача
app.get('/api/user-transactions/:userAddress', (req, res) => {
  const { userAddress } = req.params;
  
  try {
    const historyFile = path.join(__dirname, 'database', `user_transactions_${userAddress}.json`);
    
    if (fs.existsSync(historyFile)) {
      const data = fs.readFileSync(historyFile, 'utf8');
      const transactions = JSON.parse(data);
      
      res.json({ 
        success: true, 
        transactions: transactions 
      });
    } else {
      res.json({ 
        success: true, 
        transactions: [] 
      });
    }
    
  } catch (error) {
    console.error('❌ Error loading user transactions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load user transactions' 
    });
  }
});

// API для отримання заявок на вивід користувача
app.get('/api/withdrawal-requests/:userAddress', (req, res) => {
  const { userAddress } = req.params;
  
  try {
    const requestsFile = path.join(__dirname, 'database', `withdrawal_requests_${userAddress}.json`);
    
    if (fs.existsSync(requestsFile)) {
      const data = fs.readFileSync(requestsFile, 'utf8');
      const requests = JSON.parse(data);
      
      res.json({ 
        success: true, 
        requests: requests 
      });
    } else {
      res.json({ 
        success: true, 
        requests: [] 
      });
    }
    
  } catch (error) {
    console.error('❌ Error loading withdrawal requests:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load withdrawal requests' 
    });
  }
});

// API для отримання списку активних користувачів
app.get('/api/active-users', (req, res) => {
  try {
    const activeUsersFile = path.join(__dirname, 'database', 'active_users.json');
    
    if (fs.existsSync(activeUsersFile)) {
      const data = fs.readFileSync(activeUsersFile, 'utf8');
      const activeUsers = JSON.parse(data);
      
      res.json({
        success: true,
        users: activeUsers.users,
        totalUsers: activeUsers.totalUsers,
        lastUpdated: activeUsers.lastUpdated
      });
    } else {
      res.json({
        success: true,
        users: [],
        totalUsers: 0,
        lastUpdated: Date.now()
      });
    }
    
  } catch (error) {
    console.error('❌ Error loading active users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load active users'
    });
  }
});

// API для оновлення списку активних користувачів
app.post('/api/update-active-users', (req, res) => {
  try {
    const { userAddress } = req.body;
    
    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'User address is required'
      });
    }
    
    const activeUsersFile = path.join(__dirname, 'database', 'active_users.json');
    let activeUsers = { users: [], lastUpdated: Date.now(), totalUsers: 0 };
    
    if (fs.existsSync(activeUsersFile)) {
      const data = fs.readFileSync(activeUsersFile, 'utf8');
      activeUsers = JSON.parse(data);
    }
    
    // Додаємо користувача якщо його ще немає
    if (!activeUsers.users.includes(userAddress)) {
      activeUsers.users.push(userAddress);
      activeUsers.totalUsers = activeUsers.users.length;
      activeUsers.lastUpdated = Date.now();
      
      fs.writeFileSync(activeUsersFile, JSON.stringify(activeUsers, null, 2));
      
      res.json({
        success: true,
        message: 'User added to active users list',
        totalUsers: activeUsers.totalUsers
      });
    } else {
      res.json({
        success: true,
        message: 'User already in active users list',
        totalUsers: activeUsers.totalUsers
      });
    }
    
  } catch (error) {
    console.error('❌ Error updating active users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update active users'
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DeFi Exchange Server running on port ${PORT}`);
  console.log(`📱 Main app: http://91.196.34.246:${PORT}`);
  console.log(`🔧 Admin panel: http://91.196.34.246:${PORT}/admin`);
  console.log(`❤️  Health check: http://91.196.34.246:${PORT}/health`);
  console.log(`🤖 Telegram bot proxy: http://localhost:3001`);
  
  // Ініціалізуємо стан сервера після запуску
  setTimeout(() => {
    initializeServerState();
  }, 1000); // Затримка 1 секунда для повного запуску сервера
});
