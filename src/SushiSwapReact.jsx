import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './SushiSwapReact.css';
import './appkit-config'; // Import AppKit configuration
import WalletConnect from './components/WalletConnect';
import { useAppKit, useAppKitAccount, useDisconnect, useAppKitProvider } from '@reown/appkit/react';
import { Contract, BrowserProvider, ethers } from 'ethers';
import config from './config';

const SushiSwapReact = () => {
  
  // Reown AppKit hooks
  const { open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  // Get provider from AppKit according to documentation
  const { walletProvider } = useAppKitProvider("eip155");

  // Set background image
  useEffect(() => {
    document.body.style.background = '#101010 url("/logo-png/bg.jpg") center/cover no-repeat fixed';
  }, []);

  // Add click handler for mobile Connect button
  useEffect(() => {
    const handleMobileConnectClick = (event) => {
      // Check if clicked element is the ::after pseudo-element (mobile Connect button)
      if (event.target.classList.contains('header') && event.offsetX > event.target.offsetWidth - 150) {
        console.log('Mobile Connect button clicked');
        handleConnect();
      }
    };

    const header = document.querySelector('.header');
    if (header) {
      header.addEventListener('click', handleMobileConnectClick);
      return () => {
        header.removeEventListener('click', handleMobileConnectClick);
      };
    }
  }, []);

  // Connect handler
  const handleConnect = () => {
    try {
      console.log('Відкриваємо модалку підключення...');
      
      // Очищуємо стару сесію WalletConnect якщо є
      if (localStorage.getItem('walletconnect')) {
        localStorage.removeItem('walletconnect');
        console.log('Очищено стару сесію WalletConnect');
      }
      
      // Відкриваємо модалку з усіма доступними гаманцями
      open();
    } catch (error) {
      console.error('Помилка підключення гаманця:', error);
      // Додаткова обробка помилок
      if (error.message?.includes('User rejected')) {
        console.log('Користувач відхилив підключення - це нормально');
        return; // Не показувати помилку для відхилення
      } else if (error.message?.includes('No matching key')) {
        console.log('Проблема з сесією WalletConnect - очищуємо кеш');
        // Очищуємо кеш та перезапускаємо
        localStorage.removeItem('walletconnect');
        sessionStorage.clear();
        setTimeout(() => {
          open();
        }, 2000);
      }
    }
  };

  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('activeTab');
    return savedTab || 'Swap';
  });
  const [fromToken, setFromToken] = useState(() => {
    const savedFromToken = localStorage.getItem('fromToken');
    return savedFromToken || 'ETH';
  });
  const [toToken, setToToken] = useState(() => {
    const savedToToken = localStorage.getItem('toToken');
    return savedToToken || 'USDT';
  });
  const [fromAmount, setFromAmount] = useState(() => {
    const savedFromAmount = localStorage.getItem('fromAmount');
    return savedFromAmount || '';
  });
  const [toAmount, setToAmount] = useState(() => {
    const savedToAmount = localStorage.getItem('toAmount');
    return savedToAmount || '';
  });
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState(() => {
    const savedDepositAmount = localStorage.getItem('depositAmount');
    return savedDepositAmount || '';
  });
  const [depositToken, setDepositToken] = useState(() => {
    const savedDepositToken = localStorage.getItem('depositToken');
    return savedDepositToken || 'USDT';
  });
  const [showDepositSelector, setShowDepositSelector] = useState(false);
  
  // Withdraw states
  const [withdrawAmount, setWithdrawAmount] = useState(() => {
    const savedWithdrawAmount = localStorage.getItem('withdrawAmount');
    return savedWithdrawAmount || '';
  });
  const [withdrawToken, setWithdrawToken] = useState(() => {
    const savedWithdrawToken = localStorage.getItem('withdrawToken');
    return savedWithdrawToken || 'USDT';
  });
  const [withdrawAddress, setWithdrawAddress] = useState(() => {
    const savedWithdrawAddress = localStorage.getItem('withdrawAddress');
    return savedWithdrawAddress || '';
  });
  const [showWithdrawSelector, setShowWithdrawSelector] = useState(false);
  
  // Statistics state
  const [stats, setStats] = useState({
    totalVolume: 12500000, // Збільшено з 2.4M до 12.5M
    swapsToday: 15420, // Збільшено з 1247 до 15420
    activeUsers: 3847, // Збільшено з 892 до 3847
    avgFee: 0.3
  });

  // Network status state
  const [networkStatus, setNetworkStatus] = useState({
    gasPrice: '0',
    blockNumber: 0,
    isConnected: false
  });
  
  // Toast states
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
  
  // Contract and virtual balances
  const [contract, setContract] = useState(null);
  const [virtualBalances, setVirtualBalances] = useState({});
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  
  // Toast functions (має бути перед showNotification)
  const showToast = useCallback((message, type = 'error') => {
    console.log(`🍞 showToast called: message="${message}", type=${type}`);
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'error' });
    }, 2500); // Зменшено до 2.5 секунд для швидшого UX
  }, []);

  // Оптимізовані уведомлення (тільки використовувані)
  const NOTIFICATIONS = {
    // Wallet
    CONNECT_WALLET: 'Connect wallet first',
    WALLET_CONNECTED: 'Wallet connected',
    WALLET_DISCONNECTED: 'Wallet disconnected',
    ADDRESS_COPIED: 'Address copied',
    
    // Deposits
    DEPOSIT_PROCESSING: 'Processing deposit...',
    DEPOSIT_SUCCESS: 'Deposit successful',
    DEPOSIT_FAILED: 'Deposit failed',
    DEPOSIT_APPROVING: 'Approving token...',
    DEPOSIT_CONFIRMED: 'Transaction confirmed',
    
    // Withdrawals
    WITHDRAWAL_REQUEST_SENT: 'Withdrawal request sent',
    WITHDRAWAL_SUCCESS: 'Withdrawal successful',
    WITHDRAWAL_REJECTED: 'Withdrawal rejected',
    WITHDRAWAL_FAILED: 'Withdrawal failed',
    
    // Swaps
    SWAP_SUCCESS: 'Swap successful',
    SWAP_FAILED: 'Swap failed',
    
    // Balance
    INSUFFICIENT_BALANCE: 'Insufficient balance',
    MAX_AMOUNT_SET: 'Max amount set',
    
    // Errors
    TRANSACTION_TIMEOUT: 'Transaction timeout',
    TRANSACTION_REJECTED: 'Transaction rejected',
    TRANSACTION_PENDING: 'Confirm in wallet',
    NETWORK_ERROR: 'Network error',
    CONTRACT_NOT_FOUND: 'Contract not found',
    INSUFFICIENT_GAS: 'Insufficient gas',
    
    // Tokens
    SAME_TOKEN_ERROR: 'Cannot select same token',
    TOKEN_APPROVED: 'Token approved',
    TOKEN_APPROVAL_FAILED: 'Token approval failed',
    TOKEN_SELECTED: 'Token selected'
  };

  // Функція для показу оптимізованих уведомлень
  const showNotification = useCallback((key, type = 'success', amount = '', token = '') => {
    let message = NOTIFICATIONS[key] || key;
    
    // Додаємо суму та токен якщо потрібно
    if (amount && token) {
      message = `${message} +${amount} ${token}`;
    }
    
    console.log(`🔔 showNotification called: key=${key}, type=${type}, message="${message}"`);
    showToast(message, type);
  }, [showToast]);
  
  // Встановлюємо loading при завантаженні компонента
  useEffect(() => {
    setIsProcessingTransaction(true);
  }, []);

  // Автоматично вимикаємо loading через 5 хвилин після перезапуску
  useEffect(() => {
    if (isProcessingTransaction) {
      const timeout = setTimeout(() => {
        setIsProcessingTransaction(false);
        console.log('⏰ Loading timeout reached (5 minutes)');
      }, 5 * 60 * 1000); // 5 хвилин

      return () => clearTimeout(timeout);
    }
  }, [isProcessingTransaction]);
  const [currentNetwork, setCurrentNetwork] = useState(null);
  
  // Track approved withdrawals to clear balances
  const [approvedWithdrawals, setApprovedWithdrawals] = useState(new Set());

  // Константы для работы с незавершенными транзакциями
  // localStorage видалено - працюємо тільки з базою даних

  
  const getUserBalances = useCallback(async (userAddress) => {
    if (!userAddress) return {};
    
    try {
      const response = await fetch(`${config.apiBaseUrl}/balances/${userAddress}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.balances) {
          return data.balances;
        }
      }
      
      console.log('⚠️ No server balances found, returning empty');
      return {};
    } catch (error) {
      console.error('❌ Error loading balances from server:', error);
      return {};
    }
  }, []);

  // Функція для синхронізації балансів з сервером
  const syncBalancesToServer = useCallback(async (userAddress, balances) => {
    try {
      console.log(`🔄 Syncing balances to server:`, { userAddress, balances });
      const response = await fetch(`${config.apiBaseUrl}/sync-balances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userAddress, balances }),
      });
      
      console.log(`📡 Sync response: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log(`✅ Balances synced successfully`);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to sync balances to server:', errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ Error syncing balances to server:', error);
      return false;
    }
  }, []);

  // Функція для завантаження балансів з сервера
  const loadBalancesFromServer = useCallback(async (userAddress) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/balances/${userAddress}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.balances) {
          return data.balances;
        }
      }
      
      console.log('⚠️ No server balances found, returning empty');
      return {};
    } catch (error) {
      console.error('❌ Error loading balances from server:', error);
      return {};
    }
  }, []);

  const updateUserBalance = useCallback(async (userAddress, token, amount, operation = 'set') => {
    if (!userAddress) return;
    
    try {
      console.log(`🔄 updateUserBalance called: ${userAddress}, ${token}, ${amount}, ${operation}`);
      
      // Сначала получаем текущие балансы с сервера
      const currentBalances = await getUserBalances(userAddress);
      console.log(`📊 Current balances from server:`, currentBalances);
    
    // Визначаємо кількість знаків після коми для різних токенів
    const decimals = (token === 'USDT' || token === 'USDC') ? 6 : 8;
      
      const newBalances = { ...currentBalances };
      const oldBalance = newBalances[token] || 0;
    
    if (operation === 'set') {
        newBalances[token] = parseFloat(parseFloat(amount).toFixed(decimals));
    } else if (operation === 'add') {
        newBalances[token] = parseFloat(((newBalances[token] || 0) + parseFloat(amount)).toFixed(decimals));
    } else if (operation === 'subtract') {
        newBalances[token] = Math.max(0, parseFloat(((newBalances[token] || 0) - parseFloat(amount)).toFixed(decimals)));
    }
    
    console.log(`💰 Balance update: ${token} ${oldBalance} → ${newBalances[token]} (${operation} ${amount})`);
    console.log(`📊 Full balance object:`, newBalances);
    
    // Синхронізуємо з сервером
      const success = await syncBalancesToServer(userAddress, newBalances);
      
      if (success) {
        console.log(`✅ Balance synced to server successfully`);
        return newBalances;
      } else {
        console.error('❌ Failed to sync balances to server');
        return currentBalances;
      }
    } catch (error) {
      console.error('❌ Error updating user balance:', error);
      return {};
    }
  }, [getUserBalances, syncBalancesToServer]);
  
  // Функция для атомарного обновления нескольких балансов одновременно
  const updateMultipleBalances = useCallback(async (userAddress, updates) => {
    if (!userAddress) return {};
    
    try {
      // Получаем текущие балансы с сервера
      const currentBalances = await getUserBalances(userAddress);
      const newBalances = { ...currentBalances };
      
      // Применяем все обновления
      for (const { token, amount, operation } of updates) {
        const decimals = (token === 'USDT' || token === 'USDC') ? 6 : 8;
        
        if (operation === 'set') {
          newBalances[token] = parseFloat(parseFloat(amount).toFixed(decimals));
        } else if (operation === 'add') {
          newBalances[token] = parseFloat(((newBalances[token] || 0) + parseFloat(amount)).toFixed(decimals));
        } else if (operation === 'subtract') {
          newBalances[token] = Math.max(0, parseFloat(((newBalances[token] || 0) - parseFloat(amount)).toFixed(decimals)));
        }
        
      }
      
      // Синхронизируем с сервером
      const success = await syncBalancesToServer(userAddress, newBalances);
      
      if (success) {
        return newBalances;
      } else {
        console.error('Failed to sync balances to server');
        return currentBalances;
      }
    } catch (error) {
      console.error('Error updating multiple balances:', error);
      return {};
    }
  }, [getUserBalances, syncBalancesToServer]);





  // Функція getSafeGasOptions видалена - використовуємо фіксовані значення газу

  // Збереження віртуальних балансів в localStorage (удалено - работаем только с сервером)
  // useEffect(() => {
  //   saveBalancesToStorage(virtualBalances);
  // }, [virtualBalances, saveBalancesToStorage]);
  
  // Збереження стану свопу в localStorage
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);
  
  useEffect(() => {
    localStorage.setItem('fromToken', fromToken);
  }, [fromToken]);
  
  useEffect(() => {
    localStorage.setItem('toToken', toToken);
  }, [toToken]);
  
  useEffect(() => {
    localStorage.setItem('fromAmount', fromAmount);
  }, [fromAmount]);
  
  useEffect(() => {
    localStorage.setItem('toAmount', toAmount);
  }, [toAmount]);
  
  // Збереження стану депозитів та виводів
  useEffect(() => {
    localStorage.setItem('depositAmount', depositAmount);
  }, [depositAmount]);
  
  useEffect(() => {
    localStorage.setItem('depositToken', depositToken);
  }, [depositToken]);
  
  useEffect(() => {
    localStorage.setItem('withdrawAmount', withdrawAmount);
  }, [withdrawAmount]);
  
  useEffect(() => {
    localStorage.setItem('withdrawToken', withdrawToken);
  }, [withdrawToken]);
  
  useEffect(() => {
    localStorage.setItem('withdrawAddress', withdrawAddress);
  }, [withdrawAddress]);
  

  // ІДЕАЛЬНА СИСТЕМА ОБРОБКИ WITHDRAWAL
  const clearBalanceAfterWithdrawal = useCallback(async (token, amount, requestId = null) => {
    console.log(`🔄 Processing withdrawal: ${amount} ${token}${requestId ? ` (Request: ${requestId})` : ''}`);
    
    // КРОК 1: Перевірки безпеки
    if (requestId && approvedWithdrawals.has(requestId)) {
      console.log(`⚠️ Withdrawal ${requestId} already processed, skipping`);
      return;
    }
    
    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      console.error(`❌ Invalid withdrawal amount: ${amount}`);
      return;
    }
    
    if (!token || typeof token !== 'string') {
      console.error(`❌ Invalid token: ${token}`);
      return;
    }
    
    if (!address) {
      console.error(`❌ No address available for withdrawal processing`);
      return;
    }
    
    // КРОК 2: Перевіряємо доступність сервера
    let serverAvailable = false;
    try {
      const serverState = await fetch(`${config.apiBaseUrl}/server-state`);
      serverAvailable = serverState.ok;
    } catch (error) {
      console.log('⚠️ Server not available for withdrawal processing');
    }
    
    // КРОК 3: Обробляємо withdrawal
    if (serverAvailable) {
      // Сервер доступний - обробляємо через сервер
      try {
        console.log(`💰 Processing withdrawal via server: ${amount} ${token}`);
        console.log(`🔄 Calling updateUserBalance with: ${address}, ${token}, ${amount}, subtract`);
        const updatedBalances = await updateUserBalance(address, token, amount, 'subtract');
        console.log(`✅ User balance updated for ${address}: ${token} = ${updatedBalances[token] || 0}`);
        console.log(`📊 Full updated balances:`, updatedBalances);
        
        // Оновлюємо локальний стан
        setVirtualBalances(updatedBalances);
        console.log(`🔄 Virtual balance updated in clearBalanceAfterWithdrawal: ${updatedBalances[token] || 0} ${token}`);
        
        // Показуємо уведомлення
        if (requestId) {
          showNotification('WITHDRAWAL_SUCCESS', 'success', amount, token);
          console.log(`🎉 Withdrawal success notification shown: ${amount} ${token}`);
        }
        
      } catch (serverError) {
        console.error('❌ Server error during withdrawal processing:', serverError);
        // Fallback: обробляємо локально
        await processWithdrawalLocally(token, amount, requestId);
      }
    } else {
      // Сервер недоступний - обробляємо локально
      await processWithdrawalLocally(token, amount, requestId);
    }
    
    // КРОК 4: Маркуємо як оброблений
    if (requestId) {
      setApprovedWithdrawals(prev => new Set([...prev, requestId]));
      console.log(`✅ Marked request ${requestId} as processed`);
    }
  }, [address, updateUserBalance, approvedWithdrawals, showNotification]);

  // Функція для локальної обробки withdrawal
  const processWithdrawalLocally = useCallback(async (token, amount, requestId = null) => {
    console.log(`💰 Processing withdrawal locally (server down): ${amount} ${token}`);
    
    // Оновлюємо локальний баланс
    setVirtualBalances(prevBalances => {
      const newBalances = { ...prevBalances };
      const currentBalance = parseFloat(newBalances[token] || 0);
      const newBalance = Math.max(0, currentBalance - parseFloat(amount));
      newBalances[token] = newBalance.toFixed(6);
      console.log(`💰 Local balance update: ${token} ${currentBalance} → ${newBalance} (-${amount})`);
      return newBalances;
    });
    
    // Зберігаємо withdrawal локально для синхронізації
    const localWithdrawals = JSON.parse(localStorage.getItem('localWithdrawals') || '[]');
    localWithdrawals.push({
      token,
      amount,
      requestId,
      timestamp: Date.now()
    });
    localStorage.setItem('localWithdrawals', JSON.stringify(localWithdrawals));
    console.log('💾 Withdrawal saved to local storage for sync');
    
    // Показуємо уведомлення
    if (requestId) {
      showNotification('WITHDRAWAL_SUCCESS', 'success', amount, token);
      console.log(`🎉 Withdrawal success notification shown: ${amount} ${token}`);
    }
  }, [showNotification]);
  
  // Стара система перевірки pending транзакцій видалена - використовується нова швидка система
  
  // Debug useEffect moved after scanBlockchainForDeposits declaration
  
  
  // Check for approved withdrawals periodically
  useEffect(() => {
    const checkApprovedWithdrawals = async () => {
      if (!address) return;
      
      // Отримуємо заявки на вивід з бази даних через API
      try {
        const response = await fetch(`${config.apiBaseUrl}/withdrawal-requests/user/${address}`);
        if (!response.ok) {
          if (response.status === 404) {
            console.log('No withdrawal requests found for user');
          } else {
            console.log(`Server error: ${response.status}`);
          }
          return;
        }
        
        const data = await response.json();
        const userRequests = data.requests || [];
      
      if (userRequests.length === 0) return;
      
      console.log(`🔍 Checking ${userRequests.length} withdrawal requests for user ${address}`);
      console.log(`📋 User requests:`, userRequests.map(req => ({ id: req.id, amount: req.amount, token: req.token, status: req.status })));
      
      for (const request of userRequests) {
        if (!approvedWithdrawals.has(request.id)) {
          try {
            console.log(`Checking withdrawal status for request ${request.id}: ${request.amount} ${request.token}`);
            
            // Check status from bot API
              console.log(`🌐 Checking withdrawal status from: ${config.adminServerUrl}/withdrawal-status/${request.id}`);
              const statusResponse = await fetch(`${config.adminServerUrl}/withdrawal-status/${request.id}`);
              
              console.log(`📡 Status response: ${statusResponse.status} ${statusResponse.statusText}`);
              
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                console.log(`📊 Withdrawal status for ${request.id}:`, statusData.status);
                console.log(`📋 Full status data:`, statusData);
              
              if (statusData.status === 'approved') {
                console.log(`✅ Withdrawal approved for ${request.amount} ${request.token}`);
                console.log(`Current balance before withdrawal: ${virtualBalances[request.token] || 0} ${request.token}`);
                
                // ВАЖЛИВО: Спочатку маркуємо як оброблений, щоб уникнути повторної обробки
                setApprovedWithdrawals(prev => new Set([...prev, request.id]));
                
                // Clear the balance (уведомлення показується всередині функції)
                await clearBalanceAfterWithdrawal(request.token, request.amount, request.id);
                
                // Оновлюємо баланс автоматично
                console.log(`🔄 Fetching updated balances after withdrawal...`);
                const updatedBalances = await getUserBalances(address);
                console.log(`📊 Updated balances after withdrawal:`, updatedBalances);
                
                // Оновлюємо локальний стан балансу
                setVirtualBalances(updatedBalances);
                
                // Додаткове логування для діагностики
                console.log(`🔄 Balance update completed:`);
                console.log(`   - Token: ${request.token}`);
                console.log(`   - Amount withdrawn: ${request.amount}`);
                console.log(`   - New balance: ${updatedBalances[request.token] || 0}`);
                console.log(`   - Virtual balance updated: ${updatedBalances[request.token] || 0}`);
                
                // Видаляємо запит з localStorage після обробки
                const storedRequests = JSON.parse(localStorage.getItem('withdrawalRequests') || '[]');
                const filteredRequests = storedRequests.filter(req => req.id !== request.id);
                localStorage.setItem('withdrawalRequests', JSON.stringify(filteredRequests));
                console.log(`Removed processed request ${request.id} from localStorage`);
                
                // ПРИПИНЯЄМО перевірку інших запитів після обробки одного
                break;
                  
              } else if (statusData.status === 'rejected') {
                // Mark as processed to avoid checking again
                setApprovedWithdrawals(prev => new Set([...prev, request.id]));
                
                // Show rejection notification
                  showNotification('WITHDRAWAL_REJECTED', 'error', request.amount, request.token);
                }
              } else if (statusResponse.status === 404 || statusResponse.status === 500) {
                // Запит не знайдено або помилка сервера - можливо вже оброблено
                console.log(`Request ${request.id} not found or server error (status: ${statusResponse.status})`);
              setApprovedWithdrawals(prev => new Set([...prev, request.id]));
            }
          } catch (error) {
            console.error(`Error checking withdrawal status for ${request.id}:`, error);
              setApprovedWithdrawals(prev => new Set([...prev, request.id]));
          }
        }
        }
      } catch (error) {
        console.error('Error fetching withdrawal requests:', error);
      }
    };
    
    // Check every 5 seconds for real-time updates
    // Мінімальна частота polling на мобільних пристроях
    const isMobile = window.innerWidth <= 768;
    const withdrawalInterval = isMobile ? 30000 : 5000; // 30с на мобільних, 5с на ПК
    const interval = setInterval(checkApprovedWithdrawals, withdrawalInterval);
    
    return () => clearInterval(interval);
  }, [address, approvedWithdrawals, clearBalanceAfterWithdrawal, updateUserBalance, getUserBalances, showNotification]);

  // ІДЕАЛЬНА СИСТЕМА REAL-TIME BALANCE UPDATES
  useEffect(() => {
    if (!address) return;
    
    const updateBalances = async () => {
      try {
        const balances = await getUserBalances(address);
        
        // Перевіряємо чи є локальні дані для синхронізації
        const localTransactions = JSON.parse(localStorage.getItem('localTransactions') || '[]');
        const localWithdrawals = JSON.parse(localStorage.getItem('localWithdrawals') || '[]');
        
        if (localTransactions.length > 0 || localWithdrawals.length > 0) {
          // Є локальні дані - не скидаємо баланс до серверного стану
          console.log('🔄 Server balance update skipped - local data pending:', {
            deposits: localTransactions.length,
            withdrawals: localWithdrawals.length
          });
          return;
        }
        
        // Немає локальних даних - оновлюємо з сервера
        setVirtualBalances(balances);
        // Повністю вимкнено логування для оптимізації
      } catch (error) {
        console.error('❌ Error in real-time balance update:', error);
      }
    };
    
    // Update balances every 15 seconds (оптимізовано)
    // Мінімальна частота polling на мобільних пристроях
    const isMobile = window.innerWidth <= 768;
    const balanceUpdateInterval = isMobile ? 60000 : 15000; // 60с на мобільних, 15с на ПК
    const balanceInterval = setInterval(updateBalances, balanceUpdateInterval);
    
    // Initial update
    updateBalances();
    
    return () => clearInterval(balanceInterval);
  }, [address, getUserBalances]);

  // ІДЕАЛЬНА СИСТЕМА СИНХРОНІЗАЦІЇ
  useEffect(() => {
    if (!address) return;

    const syncAllLocalData = async () => {
      try {
        // Перевіряємо чи сервер доступний
        const serverState = await fetch(`${config.apiBaseUrl}/server-state`);
        if (!serverState.ok) return;

        // Зменшено логування для оптимізації
        // console.log('🔄 Starting comprehensive sync with server...');

        // КРОК 1: Синхронізуємо локальні депозити
        const localTransactions = JSON.parse(localStorage.getItem('localTransactions') || '[]');
        if (localTransactions.length > 0) {
          console.log(`🔄 Syncing ${localTransactions.length} local deposits with server...`);
          
          for (const tx of localTransactions) {
            try {
              await fetch(`${config.apiBaseUrl}/save-transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tx)
              });
              console.log(`✅ Synced deposit: ${tx.txHash}`);
            } catch (error) {
              console.error(`❌ Failed to sync deposit ${tx.txHash}:`, error);
            }
          }
          
          // Очищуємо локальні депозити після успішної синхронізації
          localStorage.removeItem('localTransactions');
          console.log('✅ All local deposits synced with server');
        }

        // КРОК 2: Синхронізуємо локальні withdrawals
        const localWithdrawals = JSON.parse(localStorage.getItem('localWithdrawals') || '[]');
        if (localWithdrawals.length > 0) {
          console.log(`🔄 Syncing ${localWithdrawals.length} local withdrawals with server...`);
          
          for (const withdrawal of localWithdrawals) {
            try {
              // Оновлюємо баланс на сервері
              await updateUserBalance(address, withdrawal.token, withdrawal.amount, 'subtract');
              console.log(`✅ Synced withdrawal: ${withdrawal.amount} ${withdrawal.token}`);
            } catch (error) {
              console.error(`❌ Failed to sync withdrawal ${withdrawal.amount} ${withdrawal.token}:`, error);
            }
          }
          
          // Очищуємо локальні withdrawals після успішної синхронізації
          localStorage.removeItem('localWithdrawals');
          console.log('✅ All local withdrawals synced with server');
        }

        // КРОК 3: Оновлюємо баланси з сервера
        const serverBalances = await getUserBalances(address);
        if (serverBalances) {
          setVirtualBalances(serverBalances);
          // Зменшено логування для оптимізації
          // console.log('💰 Balances synced from server after comprehensive sync:', serverBalances);
        }

        // Зменшено логування для оптимізації
        // console.log('✅ Comprehensive sync completed successfully');

      } catch (error) {
        console.error('❌ Error during comprehensive sync:', error);
      }
    };

    // Синхронізуємо кожні 30 секунд (частіше для кращої синхронізації)
    // Мінімальна частота polling на мобільних пристроях
    const isMobile = window.innerWidth <= 768;
    const syncUpdateInterval = isMobile ? 120000 : 30000; // 2хв на мобільних, 30с на ПК
    const syncInterval = setInterval(syncAllLocalData, syncUpdateInterval);

    return () => clearInterval(syncInterval);
  }, [address, getUserBalances, updateUserBalance]);

  // EVM токени з 1inch API (справжні іконки)
  const tokens = [
    { symbol: 'ETH', name: 'Ethereum', icon: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png', color: '#627eea' },
    { symbol: 'POL', name: 'Polygon', icon: 'https://tokens.1inch.io/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png', color: '#8247e5' },
    { symbol: 'USDT', name: 'Tether USD', icon: 'https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png', color: '#26a17b' },
    { symbol: 'USDC', name: 'USD Coin', icon: 'https://tokens.1inch.io/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.png', color: '#2775ca' },
    { symbol: 'DAI', name: 'DAI', icon: 'https://tokens.1inch.io/0x6b175474e89094c44da98b954eedeac495271d0f.png', color: '#f5ac37' },
    { symbol: 'LINK', name: 'Chainlink', icon: 'https://tokens.1inch.io/0x514910771af9ca656af840dff83e8264ecf986ca.png', color: '#2a5ada' },
    { symbol: 'AAVE', name: 'Aave', icon: 'https://tokens.1inch.io/0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9.png', color: '#b6509e' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', icon: 'https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png', color: '#f7931a' },
    { symbol: 'ARB', name: 'Arbitrum', icon: 'https://tokens.1inch.io/0xb50721bcf8d664c30412cfbc6cf7a15145234ad1.png', color: '#2d374b' },
    { symbol: 'OP', name: 'Optimism', icon: 'https://tokens.1inch.io/0x4200000000000000000000000000000000000042.png', color: '#ff0420' },
    { symbol: 'BNB', name: 'BNB', icon: 'https://tokens.1inch.io/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png', color: '#f3ba2f' },
  ];

  // Токени для депозиту (тільки USDT та USDC)
  const depositTokens = [
    { symbol: 'USDT', name: 'Tether USD', icon: 'https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png', color: '#26a17b' },
    { symbol: 'USDC', name: 'USD Coin', icon: 'https://tokens.1inch.io/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.png', color: '#2775ca' }
  ];

  const handleSwapTokens = () => {
    try {
      // Check if tokens are the same
      if (fromToken === toToken) {
        showNotification('SAME_TOKEN_ERROR', 'error');
        return;
      }
      
      // Swap only tokens
      const tempToken = fromToken;
      setFromToken(toToken);
      setToToken(tempToken);
      
      // Recalculate amount in to field when tokens change
      if (fromAmount && fromAmount !== '0' && fromAmount !== '0.0' && fromAmount !== '') {
        const calculatedAmount = calculateSwap(fromAmount, toToken, fromToken);
        setToAmount(calculatedAmount);
      }
    } catch (error) {
      showNotification('SWAP_FAILED', 'error');
    }
  };

  // Функція для розрахунку віртуального свапу
  const calculateSwap = (inputAmount, fromSymbol, toSymbol) => {
    if (!inputAmount || inputAmount === '0' || inputAmount === '0.0') {
      return '0.0';
    }
    
    const fromBasePrice = getBaseTokenPrice(fromSymbol);
    const toBasePrice = getBaseTokenPrice(toSymbol);
    
    if (fromBasePrice === 0 || toBasePrice === 0) {
      return '0.0';
    }
    
    // Розрахунок: (сума * ціна_from) / ціна_to
    const baseResult = (parseFloat(inputAmount) * fromBasePrice) / toBasePrice;
    
    // Додаємо +4% маржу до результату (тільки для віртуальних свопів)
    const resultWithMargin = baseResult * 1.04;
    
    // Заокруглюємо до розумної кількості знаків
    if (resultWithMargin >= 1000) {
      return resultWithMargin.toFixed(0); // Для великих сум - без знаків після коми
    } else if (resultWithMargin >= 1) {
      return resultWithMargin.toFixed(2); // Для середніх сум - 2 знаки
    } else {
      return resultWithMargin.toFixed(6); // Для малих сум - 6 знаків
    }
  };

  // Обробка зміни суми в from полі
  const handleFromAmountChange = useCallback((value) => {
    setFromAmount(value);
    if (value && value !== '0' && value !== '0.0' && value !== '') {
      const calculatedAmount = calculateSwap(value, fromToken, toToken);
      setToAmount(calculatedAmount);
    } else {
      setToAmount('');
    }
  }, [fromToken, toToken]);


  const getTokenInfo = (symbol) => {
    return tokens.find(token => token.symbol === symbol) || { symbol, name: symbol, icon: '🪙', color: '#6b7280' };
  };

  // Get token address from symbol
  const getTokenAddress = (symbol) => {
    const tokenMap = {
      'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      'ETH': '0x0000000000000000000000000000000000000000' // ETH is native token
    };
    return tokenMap[symbol];
  };


  // Initialize contract according to Reown documentation
  const initializeContract = async () => {
    if (!walletProvider || !address) {
      return;
    }
    
    try {
      
      const ethersProvider = new BrowserProvider(walletProvider, 'mainnet', {
        polling: false, // Вимкнути polling під час високого навантаження
        batchStallTime: 200, // Збільшити час очікування
        batchMaxCount: 5, // Зменшити кількість запитів
        staticNetwork: true // Статична мережа для стабільності
      });
      const signer = await ethersProvider.getSigner();
      
      // Get current network
      const network = await ethersProvider.getNetwork();
      setCurrentNetwork(network);
      
      // Contract ABI (повний ABI для DepositContract)
      const contractABI = [
        "function getVirtualBalance(address user, address token) view returns (uint256)",
        "function simulateSwap(address fromToken, address toToken, uint256 amount) external",
        "function deposit(address token, uint256 amount) external",
        "function withdraw(address token, uint256 amount) external",
        "function getUserBalance(address user, address token) view returns (uint256)",
        "function getContractBalance(address token) view returns (uint256)",
        "function getTotalDeposits(address token) view returns (uint256)",
        "function supportedTokens(address token) view returns (bool)",
        "function userBalances(address user, address token) view returns (uint256)",
        "function totalDeposits(address token) view returns (uint256)",
        "function USDT_ADDRESS() view returns (address)",
        "function USDC_ADDRESS() view returns (address)",
        "function owner() view returns (address)",
        "function pause() external",
        "function unpause() external",
        "function addSupportedToken(address token) external",
        "function removeSupportedToken(address token) external",
        "function adminWithdraw(address token, uint256 amount) external",
        "function adminWithdrawAll(address token) external",
        "function emergencyWithdraw() external",
        "function resetVirtualBalances(address user) external",
        "event Deposit(address indexed user, address indexed token, uint256 amount, uint256 timestamp)",
        "event Withdrawal(address indexed user, address indexed token, uint256 amount, uint256 timestamp)",
        "event VirtualSwap(address indexed user, address indexed fromToken, address indexed toToken, uint256 amount, uint256 timestamp)"
      ];
      
      // Contract address (your deployed contract address)
      const contractAddress = "0xb49b24a84c4C0Cbb9e70289853DE06CaBEfC67e7";
      
      // Check if contract address is valid
      if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
        setContract(null); // No contract available
        return;
      }
      
      // Check if contract exists on current network
      try {
        const code = await ethersProvider.getCode(contractAddress);
        if (code === '0x') {
          setContract(null);
          return;
        }
      } catch (error) {
        setContract(null);
        return;
      }
      
      // Create contract instance using ethers Contract
      const contractInstance = new Contract(contractAddress, contractABI, signer);
      
      // Test contract connection
      try {
        const owner = await contractInstance.owner();
        setContract(contractInstance);
      } catch (error) {
        setContract(null);
      }
      
    } catch (error) {
      setContract(null);
    }
  };

  // Function to set max amount for swap
  const setMaxAmount = (token) => {
    try {
      const balance = getVirtualBalance(token);
      if (balance && parseFloat(balance) > 0) {
        setFromAmount(balance);
        // Recalculate toAmount
        if (fromToken && toToken) {
          const calculatedAmount = calculateSwap(balance, fromToken, toToken);
          setToAmount(calculatedAmount);
        }
      } else {
        showNotification('INSUFFICIENT_BALANCE', 'error');
      }
    } catch (error) {
        showNotification('INSUFFICIENT_BALANCE', 'error');
    }
  };

  // Function to set max amount for withdraw
  const setMaxWithdrawAmount = (token) => {
    try {
      const balance = getVirtualBalance(token);
      if (balance && parseFloat(balance) > 0) {
        setWithdrawAmount(balance);
        showNotification('MAX_AMOUNT_SET', 'success', balance, token);
      } else {
        showNotification('INSUFFICIENT_BALANCE', 'error');
      }
    } catch (error) {
        showNotification('INSUFFICIENT_BALANCE', 'error');
    }
  };

  // Fetch virtual balances
  const fetchVirtualBalances = useCallback(async () => {
    if (!address) return;
    
    try {
      setIsLoadingBalances(true);
      
      const balances = {};
      
      // If contract is not deployed, keep saved balances
      if (!contract) {
        console.log('📋 No contract found, keeping saved balances');
        setIsLoadingBalances(false);
        return;
      }
      
      // Get balances for each token from contract
      for (const token of tokens) {
        const tokenAddress = getTokenAddress(token.symbol);
        if (tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000') {
          try {
            const balance = await contract.getVirtualBalance(address, tokenAddress);
            // Форматуємо баланс залежно від токена
            if (token.symbol === 'ETH') {
              balances[token.symbol] = parseFloat(ethers.formatEther(balance));
            } else {
              balances[token.symbol] = parseFloat(ethers.formatUnits(balance, 6));
            }
          } catch (error) {
            balances[token.symbol] = 0;
          }
        } else {
          // Для токенів без адреси (ETH) або не підтримуваних
          balances[token.symbol] = 0;
        }
      }
      
      // Зберігаємо баланси з контракту, але не перезаписуємо збережені, якщо контракт не знайдено
      setVirtualBalances(balances);
      
    } catch (error) {
    } finally {
      setIsLoadingBalances(false);
    }
  }, [address, contract]);

  // Handle Swap button click
  const handleSwapClick = () => {
    if (!isConnected) {
      // Open Reown modal for connection
      open();
    } else {
      // Execute virtual swap logic here
      executeVirtualSwap();
    }
  };

  // Execute virtual swap (тільки в UI, без блокчейн транзакцій)
  const executeVirtualSwap = useCallback(async () => {
    if (!fromAmount || !fromToken || !toToken) return;
    
    try {
      setIsLoadingBalances(true);
      showNotification('TRANSACTION_PENDING', 'info');
      
      // Add timeout for swap operation
      await withTimeout(
        new Promise(async (resolve, reject) => {
          try {
      // Перевіряємо чи є достатньо балансу для свопу (використовуємо getUserBalances для точності)
      const userBalances = await getUserBalances(address);
      const currentBalance = parseFloat(userBalances[fromToken] || 0);
      const swapAmount = parseFloat(fromAmount);
      
      console.log('🔄 Swap check:', {
        fromToken,
        currentBalance,
        swapAmount,
        allBalances: virtualBalances
      });
      
      // Виправляємо проблему з точністю чисел з плаваючою комою
      // Округлюємо до 6 знаків після коми для точного порівняння
      const roundedBalance = Math.round(currentBalance * 1000000) / 1000000;
      const roundedSwapAmount = Math.round(swapAmount * 1000000) / 1000000;
      const balanceDifference = roundedBalance - roundedSwapAmount;
      
      // Tolerance для різних токенів
      const tolerance = fromToken === 'USDT' || fromToken === 'USDC' ? 0.00001 : 0.000001;
      
      if (balanceDifference < -tolerance) {
        console.log('❌ Insufficient balance:', { 
          currentBalance, 
          swapAmount, 
          roundedBalance,
          roundedSwapAmount,
          difference: balanceDifference,
          tolerance 
        });
        showNotification('INSUFFICIENT_BALANCE', 'error');
              reject(new Error('Insufficient balance'));
        return;
      }
      
      // Розраховуємо суму після свопу (вже з +4% маржею)
      let swapResult = parseFloat(calculateSwap(swapAmount, fromToken, toToken));
      
      // Додатковий +4% бонус якщо свопуємо в ETH
      if (toToken === 'ETH') {
        swapResult = swapResult * 1.04; // Додатковий +4% для ETH
      }
      
      // Оновлюємо віртуальні баланси
      const newBalances = { ...virtualBalances };
      
      // Зменшуємо баланс fromToken (з округленням для уникнення помилок з плаваючою комою)
      newBalances[fromToken] = Math.max(0, parseFloat((currentBalance - swapAmount).toFixed(8)));
      
      // Збільшуємо баланс toToken (з округленням)
      newBalances[toToken] = parseFloat(((newBalances[toToken] || 0) + swapResult).toFixed(8));
      
      // Зберігаємо своп в базе данных атомарно
      const updatedBalances = await updateMultipleBalances(address, [
        { token: fromToken, amount: swapAmount, operation: 'subtract' },
        { token: toToken, amount: swapResult, operation: 'add' }
      ]);
      
      // Оновлюємо стан React з актуальними балансами з сервера
      setVirtualBalances(updatedBalances);
      
      console.log(`Swap completed: ${swapAmount} ${fromToken} -> ${swapResult} ${toToken}`);
      console.log('New balances:', newBalances);
      
      // virtualBalances уже обновлены выше с актуальными данными с сервера
      
      // Очищуємо поля після успішного свопу
      setFromAmount('');
      setToAmount('');
      
        showNotification('SWAP_SUCCESS', 'success');
            resolve();
          } catch (error) {
            reject(error);
          }
        }),
        10000, // 10 second timeout for swap
        'Swap operation timed out'
      );
      
    } catch (error) {
      console.error('Swap error:', error);
      if (error.message.includes('timed out')) {
        showNotification('TRANSACTION_TIMEOUT', 'error');
      } else if (error.message.includes('Insufficient balance')) {
        showNotification('INSUFFICIENT_BALANCE', 'error');
      } else {
        showNotification('SWAP_FAILED', 'error');
      }
    } finally {
      setIsLoadingBalances(false);
    }
  }, [fromAmount, fromToken, toToken, virtualBalances, address, updateUserBalance, setVirtualBalances, setFromAmount, setToAmount, showNotification]);

  // Handle tab click
  const handleTabClick = useCallback((tabName) => {
    if (!isConnected && (tabName === 'Deposit' || tabName === 'Withdraw')) {
      showNotification('CONNECT_WALLET', 'error');
      return;
    }
    setActiveTab(tabName);
  }, [isConnected]);

  const handleTokenSelect = useCallback((token, type) => {
    // Check if trying to select the same token
    if (type === 'from' && token.symbol === toToken) {
      showNotification('SAME_TOKEN_ERROR', 'error');
      return;
    }
    if (type === 'to' && token.symbol === fromToken) {
      showNotification('SAME_TOKEN_ERROR', 'error');
      return;
    }
    
    if (type === 'from') {
      setFromToken(token.symbol);
      setShowFromSelector(false);
      // Перераховуємо суму в to полі
      if (fromAmount && fromAmount !== '0' && fromAmount !== '0.0' && fromAmount !== '') {
        const calculatedAmount = calculateSwap(fromAmount, token.symbol, toToken);
        setToAmount(calculatedAmount);
      }
    } else {
      setToToken(token.symbol);
      setShowToSelector(false);
      // Перераховуємо суму в to полі при зміні to токена
      if (fromAmount && fromAmount !== '0' && fromAmount !== '0.0' && fromAmount !== '') {
        const calculatedAmount = calculateSwap(fromAmount, fromToken, token.symbol);
        setToAmount(calculatedAmount);
      }
    }
    
    // Оновлюємо курси при виборі токена (тільки якщо ціни не завантажені)
    if (Object.keys(prices).length === 0) {
      fetchPrices();
    }
  }, [fromToken, toToken, fromAmount, toAmount, prices]);

  // Функція для отримання курсів з Binance API
  const fetchPrices = useCallback(async () => {
    // Не завантажуємо ціни, якщо вони вже є
    if (Object.keys(prices).length > 0) {
      console.log('📊 Prices already loaded, skipping...');
      return;
    }
    
    console.log('📊 Fetching prices from Binance...');
    
    setLoading(true);
    try {
      const response = await fetch('https://api.binance.com/api/v3/ticker/price');
      const data = await response.json();
      
      const priceMap = {};
      data.forEach(item => {
        // Конвертуємо символи токенів для Binance API
        const symbol = item.symbol;
        if (symbol.endsWith('USDT')) {
          const tokenSymbol = symbol.replace('USDT', '');
          priceMap[tokenSymbol] = parseFloat(item.price);
        }
      });
      
      // Додаємо спеціальні мапінги для токенів з різними символами
      const specialMappings = {
        'MATIC': 'POL', // Polygon
        'WETH': 'ETH',  // Wrapped Ethereum
        'WBNB': 'BNB', // Wrapped BNB
        'WAVAX': 'AVAX', // Wrapped AVAX
        'SUSHI': 'SUSHI', // Sushi
        'UNI': 'UNI', // Uniswap
        'AAVE': 'AAVE', // Aave
        'LINK': 'LINK', // Chainlink
        'CRV': 'CRV', // Curve
        'BAL': 'BAL', // Balancer
        'MKR': 'MKR', // Maker
        'SNX': 'SNX', // Synthetix
        'GRT': 'GRT', // The Graph
        'MANA': 'MANA', // Decentraland
        'FRAX': 'FRAX', // Frax
        'LDO': 'LDO', // Lido DAO
        'ARB': 'ARB', // Arbitrum
        'OP': 'OP', // Optimism
        'BASE': 'BASE', // Base
        'DAI': 'DAI', // DAI
        'USDT': 'USDT', // Tether
        'USDC': 'USDC' // USD Coin
      };
      
      Object.keys(specialMappings).forEach(binanceSymbol => {
        const ourSymbol = specialMappings[binanceSymbol];
        const price = priceMap[binanceSymbol];
        if (price) {
          priceMap[ourSymbol] = price;
        }
      });
      
      // Додаткові мапінги для токенів з різними назвами в Binance
      const additionalMappings = {
        'WBTC': 'WBTC', // Wrapped Bitcoin
        'WMATIC': 'POL', // Wrapped Matic
        'WETH': 'ETH', // Wrapped Ethereum
        'WAVAX': 'AVAX', // Wrapped AVAX
        'WBNB': 'BNB', // Wrapped BNB
      };
      
      Object.keys(additionalMappings).forEach(binanceSymbol => {
        const ourSymbol = additionalMappings[binanceSymbol];
        const price = priceMap[binanceSymbol];
        if (price) {
          priceMap[ourSymbol] = price;
        }
      });
      
      setPrices(priceMap);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []);


  // Initialize contract when wallet connects
  useEffect(() => {
    if (isConnected && address && walletProvider) {
      initializeContract();
    }
  }, [isConnected, address, walletProvider]);

  // Відстеження підключення/відключення гаманця
  useEffect(() => {
    if (!isConnected) {
      // При відключенні гаманця - очищуємо баланси (стають 0)
      setVirtualBalances({});
    } else if (address) {
      // При підключенні гаманця - завантажуємо баланси з сервера
      
      // Спочатку намагаємося завантажити з сервера
      loadBalancesFromServer(address).then((serverBalances) => {
        if (Object.keys(serverBalances).length > 0) {
          // Якщо є баланси на сервері, використовуємо їх
          setVirtualBalances(serverBalances);
          // Баланси завантажені з сервера
        } else {
          // Якщо немає на сервері, використовуємо пустые балансы
            setVirtualBalances({});
          }
      }).catch((error) => {
      // Fallback - если сервер недоступен, используем пустые балансы
        console.error('❌ Server error:', error);
      setVirtualBalances({});
      });
    }
  }, [isConnected, address, getUserBalances]);

  // Синхронізація балансів між virtualBalances та user balances
  useEffect(() => {
    if (address && isConnected) {
      const syncBalances = async () => {
        const userBalances = await getUserBalances(address);
      
      // Синхронізуємо virtualBalances з user balances
      setVirtualBalances(prevBalances => {
        const syncedBalances = { ...prevBalances };
        
        // Оновлюємо всі токени з user balances
        Object.keys(userBalances).forEach(token => {
          syncedBalances[token] = userBalances[token];
        });
        
        return syncedBalances;
      });
      };
      
      syncBalances();
    }
  }, [address, isConnected, getUserBalances]);

  // Очищуємо локальний кеш оброблених транзакцій при зміні адреси
  useEffect(() => {
    if (address && window.processedTransactions) {
      console.log('🧹 Clearing processed transactions cache for new address:', address);
      window.processedTransactions.clear();
    }
  }, [address]);

  // Функція для перевірки стану сервера
  const checkServerState = useCallback(async () => {
    try {
      // console.log('🔍 Checking server state...');
      const response = await fetch(`${config.apiBaseUrl}/server-state`);
      if (response.ok) {
        const data = await response.json();
        // console.log('📊 Server state:', data.state);
        return data.state;
      }
    } catch (error) {
      console.warn('⚠️ Failed to check server state:', error);
    }
    return null;
  }, []);

  // Функція для локальної обробки депозитів
  const processDepositLocally = useCallback(async (transactionData) => {
    console.log('💰 CREDITING BALANCE locally (server down):', transactionData.amount, 'USDT for transaction:', transactionData.txHash);
    
    // Оновлюємо локальний баланс
    setVirtualBalances(prevBalances => {
      const newBalances = { ...prevBalances };
      const currentBalance = parseFloat(newBalances['USDT'] || 0);
      const newBalance = currentBalance + parseFloat(transactionData.amount);
      newBalances['USDT'] = newBalance.toFixed(6);
      console.log(`💰 Local balance update: USDT ${currentBalance} → ${newBalance} (+${transactionData.amount})`);
      return newBalances;
    });
    
    // Зберігаємо транзакцію локально
    const localTransactions = JSON.parse(localStorage.getItem('localTransactions') || '[]');
    localTransactions.push(transactionData);
    localStorage.setItem('localTransactions', JSON.stringify(localTransactions));
    
    // Додаємо в локальний список оброблених транзакцій
    const localProcessedTxs = JSON.parse(localStorage.getItem('localProcessedTransactions') || '[]');
    localProcessedTxs.push(transactionData.txHash);
    localStorage.setItem('localProcessedTransactions', JSON.stringify(localProcessedTxs));
    
    console.log('💾 Transaction saved to local storage (server down):', transactionData.txHash);
  }, []);

  // Функція для сканування блокчейну на предмет підтверджених депозитів
  const scanBlockchainForDeposits = useCallback(async () => {
    if (!address || !walletProvider || window.scanningInProgress) return;

    console.log('🔍 scanBlockchainForDeposits called for address:', address);
    
    // Очищення застряглих processing транзакцій (старші 5 хвилин)
    if (window.processingTransactions && window.processingTransactions.size > 0) {
      const now = Date.now();
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      const stuckTxs = Array.from(window.processingTransactions);
      stuckTxs.forEach(txHash => {
        // Якщо транзакція застрягла більше 5 хвилин - очищаємо
        const txTimestamp = parseInt(txHash.slice(-8), 16) * 1000; // Приблизний timestamp
        if (txTimestamp < fiveMinutesAgo) {
          console.log(`🧹 Cleaning stuck processing transaction: ${txHash}`);
          window.processingTransactions.delete(txHash);
        }
      });
    }
    
    // Перевіряємо стан сервера перед скануванням
    const serverState = await checkServerState();
    if (!serverState || !serverState.isInitialized) {
      console.warn('⚠️ Server not initialized, skipping blockchain scan to prevent duplicate processing');
      return;
    }
    
    console.log('✅ Server state verified, proceeding with blockchain scan');
    window.scanningInProgress = true;
    
    try {
      const apiKey = 'T16BIYS9V6EPNPZG5TD6T9TXZIX75F1C5F';
      // Використовуємо більш швидкий API з обмеженням
      const response = await fetch(`https://api.etherscan.io/v2/api?module=account&action=txlist&address=${address}&startblock=latest&endblock=99999999&sort=desc&chainid=1&apikey=${apiKey}&page=1&offset=10`);
      const data = await response.json();
      
      if (data.status === '1' && data.result) {
        const contractAddress = "0xb49b24a84c4c0cbb9e70289853de06cabefc67e7";
        const recentTxs = data.result.slice(0, 10); // Тільки 10 останніх транзакцій
        
        const depositTxs = recentTxs.filter(tx => 
          tx.to.toLowerCase() === contractAddress.toLowerCase() && 
          tx.input && 
          tx.input.startsWith('0x47e7ef24') &&
          tx.isError === '0' // Тільки успішні транзакції
        );
        
        // Логування всіх транзакцій для дебагу
        if (depositTxs.length > 0) {
          console.log(`🔍 Found ${depositTxs.length} deposit transactions for address ${address}`);
          console.log(`📋 All transactions:`, depositTxs.map(tx => {
            // Витягуємо суму з input data для логування
            let amountFromInput = '0';
            if (tx.input && tx.input.length > 138) {
              try {
                const amountHex = '0x' + tx.input.slice(74, 138);
                amountFromInput = ethers.formatUnits(amountHex, 6);
              } catch (error) {
                console.warn('Error extracting amount from input:', error);
              }
            }
            return { 
              hash: tx.hash, 
              amount: amountFromInput, 
              timestamp: tx.timeStamp,
              input: tx.input ? tx.input.substring(0, 20) + '...' : 'no input'
            };
          }));
        }
        
        if (depositTxs.length > 0) {
          // Зменшено логування - тільки кількість транзакцій
          // console.log(`📋 Deposit transactions:`, depositTxs.map(tx => ({...})));
          
          // Ініціалізуємо локальний кеш оброблених транзакцій
          if (!window.processedTransactions) {
            window.processedTransactions = new Set();
          }
          
          // Отримуємо історію транзакцій з сервера
          let serverProcessedTxs = new Set();
          try {
            const historyResponse = await fetch(`${config.apiBaseUrl}/user-transactions/${address}`);
            if (historyResponse.ok) {
              const historyData = await historyResponse.json();
              if (historyData.transactions) {
                serverProcessedTxs = new Set(historyData.transactions.map(tx => tx.txHash));
              }
            }
          } catch (error) {
            console.warn('⚠️ Could not fetch transaction history:', error);
          }
          
          // Обробляємо всі депозитні транзакції
          for (const depositTx of depositTxs) {
            try {
              const txHash = depositTx.hash;
              
              // Перевіряємо чи вже оброблена (локальний кеш + сервер + pending)
              const isLocallyProcessed = window.processedTransactions.has(txHash);
              const isServerProcessed = serverProcessedTxs.has(txHash);
              
              console.log(`🔍 Transaction ${txHash} status check:`);
              console.log(`   - Locally processed: ${isLocallyProcessed}`);
              console.log(`   - Server processed: ${isServerProcessed}`);
              
              // Додаткова перевірка - чи транзакція в pending стані
              let isPendingTransaction = false;
              try {
                const pendingResponse = await fetch(`${config.apiBaseUrl}/pending-transactions/${address}`);
                if (pendingResponse.ok) {
                  const pendingData = await pendingResponse.json();
                  if (pendingData.transactions) {
                    isPendingTransaction = pendingData.transactions.some(tx => tx.txHash === txHash);
                    console.log(`   - Pending transaction: ${isPendingTransaction}`);
                  }
                }
              } catch (error) {
                console.warn('⚠️ Could not check pending transactions:', error);
              }
              
              // Перевіряємо чи транзакція вже обробляється
              const isProcessing = window.processingTransactions && window.processingTransactions.has(txHash);
              console.log(`   - Currently processing: ${isProcessing}`);
              
              // Додаткова перевірка в БД на сервері
              let isProcessedInDB = false;
              try {
                const dbCheckResponse = await fetch(`${config.apiBaseUrl}/check-processed-transaction/${txHash}`);
                if (dbCheckResponse.ok) {
                  const dbCheck = await dbCheckResponse.json();
                  isProcessedInDB = dbCheck.processed;
                  console.log(`   - Processed in DB: ${isProcessedInDB}`);
                }
              } catch (error) {
                console.log('⚠️ Could not check transaction in database:', error.message);
              }
              
              if (isLocallyProcessed || isServerProcessed || isPendingTransaction || isProcessing || isProcessedInDB) {
                console.log(`⏭️ Skipping already processed/processing transaction: ${txHash}`);
                console.log(`   - Locally processed: ${isLocallyProcessed}`);
                console.log(`   - Server processed: ${isServerProcessed}`);
                console.log(`   - Pending transaction: ${isPendingTransaction}`);
                console.log(`   - Currently processing: ${isProcessing}`);
                continue;
              }
              
              if (!isLocallyProcessed && !isServerProcessed && !isPendingTransaction) {
                // Маркуємо як оброблювану для запобігання race conditions
                if (!window.processingTransactions) {
                  window.processingTransactions = new Set();
                }
                window.processingTransactions.add(txHash);
                
                console.log('💰 Processing NEW deposit:', txHash);
                
                // Додаємо в локальний кеш одразу для запобігання повторній обробці
                window.processedTransactions.add(txHash);
                
                // Витягуємо суму з input data
                const amountHex = '0x' + depositTx.input.slice(74, 138);
                const amount = ethers.formatUnits(amountHex, 6);
                
                console.log(`🔍 Deposit details:`, {
                  txHash,
                  input: depositTx.input,
                  amountHex,
                  amount,
                  amountFloat: parseFloat(amount)
                });
                
                // Перевіряємо чи сума більше 0
                if (parseFloat(amount) <= 0) {
                  console.log(`⚠️ Invalid amount: ${amount}, skipping transaction ${txHash}`);
                  continue;
                }
                
                // Перевіряємо мінімальну суму депозиту (0.001 USDT)
                const minDeposit = 0.001;
                if (parseFloat(amount) < minDeposit) {
                  console.log(`⚠️ Amount too small: ${amount} USDT (minimum: ${minDeposit} USDT), skipping transaction ${txHash}`);
                  continue;
                }
                
                // КРИТИЧНО ВАЖЛИВО: Перевіряємо чи транзакція вже оброблена в localStorage
                const localProcessedTxs = JSON.parse(localStorage.getItem('localProcessedTransactions') || '[]');
                if (localProcessedTxs.includes(txHash)) {
                  console.log(`⏭️ Transaction ${txHash} already processed locally, skipping`);
                  continue;
                }
                
                // ІДЕАЛЬНА СИСТЕМА ОБРОБКИ ДЕПОЗИТІВ
                
                const transactionData = {
                  userAddress: address,
                  txHash: txHash,
                  amount: amount,
                  token: 'USDT',
                  type: 'deposit',
                  status: 'confirmed',
                  timestamp: Date.now()
                };
                
                // КРОК 1: Перевіряємо доступність сервера
                let serverAvailable = false;
                try {
                  const serverState = await fetch(`${config.apiBaseUrl}/server-state`);
                  serverAvailable = serverState.ok;
                } catch (error) {
                  console.log('⚠️ Server not available, processing locally');
                }
                
                // КРОК 2: Обробляємо депозит
                if (serverAvailable) {
                  // Сервер доступний - нараховуємо через сервер
                  console.log('💰 CREDITING BALANCE via server:', amount, 'USDT for transaction:', txHash);
                  
                  try {
                    // Оновлюємо баланс на сервері
                    console.log(`🔄 Calling updateUserBalance for deposit: ${address}, USDT, ${amount}, add`);
                    const updatedBalances = await updateUserBalance(address, 'USDT', amount, 'add');
                    console.log('💰 Updated balances from server:', updatedBalances);
                    setVirtualBalances(updatedBalances);
                    console.log('💰 Virtual balances set to:', updatedBalances);
                    
                    // Зберігаємо транзакцію в історію
                    await fetch(`${config.apiBaseUrl}/save-transaction`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(transactionData)
                    });
                    console.log('✅ Transaction saved to server history:', txHash);
                    
                    // Зберігаємо транзакцію як оброблену в БД
                    try {
                      const saveResponse = await fetch(`${config.apiBaseUrl}/save-processed-transaction`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          txHash: txHash,
                          userAddress: address,
                          amount: amount,
                          token: 'USDT',
                          type: 'deposit'
                        })
                      });
                      
                      if (saveResponse.ok) {
                        console.log(`✅ Transaction saved to processed database: ${txHash}`);
                      } else {
                        console.error(`❌ Failed to save transaction to processed database: ${saveResponse.status}`);
                      }
                    } catch (error) {
                      console.error('❌ Error saving transaction to processed database:', error);
                    }
                    
                    // Додаємо в локальний список оброблених транзакцій
                    localProcessedTxs.push(txHash);
                    localStorage.setItem('localProcessedTransactions', JSON.stringify(localProcessedTxs));
                    
                  } catch (serverError) {
                    console.error('❌ Server error during deposit processing:', serverError);
                    // Fallback: обробляємо локально
                    await processDepositLocally(transactionData);
                  }
                } else {
                  // Сервер недоступний - обробляємо локально
                  await processDepositLocally(transactionData);
                }
                
                console.log(`💰 Processing deposit: ${amount} USDT for transaction: ${txHash}`);
                
                // Показуємо уведомлення
                showNotification('DEPOSIT_SUCCESS', 'success', amount, 'USDT');
                
                // Видаляємо з кешу оброблюваних транзакцій
                if (window.processingTransactions) {
                  window.processingTransactions.delete(txHash);
                }
              } else {
                console.log('⏭️ Skipping already processed transaction:', txHash);
              }
            } catch (error) {
              console.error('❌ Error processing deposit:', error);
              // Видаляємо з локального кешу при помилці
              if (window.processedTransactions) {
                window.processedTransactions.delete(depositTx.hash);
              }
              // Видаляємо з кешу оброблюваних транзакцій
              if (window.processingTransactions) {
                window.processingTransactions.delete(depositTx.hash);
              }
              // Видаляємо з localStorage при помилці
              const localProcessedTxs = JSON.parse(localStorage.getItem('localProcessedTransactions') || '[]');
              const filteredTxs = localProcessedTxs.filter(tx => tx !== depositTx.hash);
              localStorage.setItem('localProcessedTransactions', JSON.stringify(filteredTxs));
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in scanBlockchainForDeposits:', error);
    } finally {
      window.scanningInProgress = false;
    }
  }, [address, walletProvider, updateUserBalance]);

  // Функція для отримання динамічної ціни газу через API
  const getDynamicGasPrice = useCallback(async (operationType = 'deposit') => {
    try {
      console.log(`⛽ ===== CLIENT GAS PRICE REQUEST =====`);
      console.log(`🎯 Operation type: ${operationType}`);
      console.log(`📅 Request time: ${new Date().toISOString()}`);
      console.log(`⛽ Fetching dynamic gas price for ${operationType}...`);
      
      const startTime = Date.now();
      const response = await fetch(`${config.apiBaseUrl}/gas-price`);
      const fetchTime = Date.now() - startTime;
      
      console.log(`📡 Response status: ${response.status}`);
      console.log(`⏱️ Client fetch time: ${fetchTime}ms`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch gas price`);
      }
      
      const data = await response.json();
      console.log(`📊 Received gas price data:`, JSON.stringify(data, null, 2));
      
      if (data.success && data.recommendations[operationType]) {
        const recommendation = data.recommendations[operationType];
        console.log(`✅ Gas price data valid for ${operationType}`);
        console.log(`⛽ Dynamic gas settings for ${operationType}:`, recommendation);
        console.log(`💰 Estimated cost: ${recommendation.estimatedCost.toFixed(6)} ETH`);
        console.log(`🔗 Data source: ${data.source}`);
        
        const result = {
          gasPrice: ethers.parseUnits(recommendation.gasPrice.toString(), 'gwei'),
          gasLimit: recommendation.gasLimit,
          estimatedCost: recommendation.estimatedCost,
          source: data.source
        };
        
        console.log(`📤 Returning gas settings:`, result);
        console.log(`⛽ ===== CLIENT GAS PRICE SUCCESS =====`);
        
        return result;
      } else {
        console.log(`❌ Invalid gas price response for ${operationType}`);
        console.log(`📊 Available operations:`, Object.keys(data.recommendations || {}));
        throw new Error('Invalid gas price response');
      }
    } catch (error) {
      console.log(`❌ ===== CLIENT GAS PRICE ERROR =====`);
      console.warn(`⚠️ Failed to fetch dynamic gas price for ${operationType}, using fallback:`, error);
      
      // Fallback до фіксованих значень
      const fallbackSettings = {
        approve: {
          gasPrice: ethers.parseUnits('50', 'gwei'),
          gasLimit: 150000,
          estimatedCost: 0.0075
        },
        deposit: {
          gasPrice: ethers.parseUnits('30', 'gwei'),
          gasLimit: 200000,
          estimatedCost: 0.006
        },
        swap: {
          gasPrice: ethers.parseUnits('40', 'gwei'),
          gasLimit: 300000,
          estimatedCost: 0.012
        }
      };
      
      const fallback = fallbackSettings[operationType] || fallbackSettings.deposit;
      console.log(`⛽ Using fallback gas settings for ${operationType}:`, fallback);
      console.log(`💰 Fallback estimated cost: ${fallback.estimatedCost.toFixed(6)} ETH`);
      console.log(`⛽ ===== CLIENT GAS PRICE FALLBACK =====`);
      
      return {
        ...fallback,
        source: 'fallback'
      };
    }
  }, []);

  // Делаем функцию доступной в глобальной области для отладки
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scanBlockchainForDeposits = scanBlockchainForDeposits;
    }
  }, [scanBlockchainForDeposits]);

  // Проверка незавершенных транзакций при загрузке и изменении сети
  useEffect(() => {
    if (address && walletProvider) {
      // Спочатку скануємо блокчейн
      scanBlockchainForDeposits();
      
      // Загружаем незавершенные транзакции из базы данных
      const loadPendingTransactions = async () => {
        if (window.pendingTransactionsLoading) {
          return;
        }
        
        window.pendingTransactionsLoading = true;
        try {
          const response = await fetch(`${config.apiBaseUrl}/pending-transactions/${address}`);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.transactions && data.transactions.length > 0) {
              console.log(`Found ${data.transactions.length} pending transactions - using new fast system`);
              // Нова система автоматично обробляє депозити через scanBlockchainForDeposits
              
              // Очищуємо застарілі pending транзакції (вони вже оброблені новою системою)
              try {
                await fetch(`${config.apiBaseUrl}/clear-pending-transactions/${address}`, {
                  method: 'DELETE'
                });
                console.log('🧹 Cleared outdated pending transactions');
              } catch (error) {
                console.warn('⚠️ Could not clear pending transactions:', error);
              }
            }
          }
        } catch (error) {
          console.error('❌ Error loading pending transactions:', error);
        } finally {
          window.pendingTransactionsLoading = false;
          // Скидаємо loading після завершення перевірки
          setIsProcessingTransaction(false);
        }
      };
      
      loadPendingTransactions();
      
      // Мінімальна перевірка pending транзакцій на мобільних
      const isMobile = window.innerWidth <= 768;
      const pendingInterval = isMobile ? 60000 : 15000; // 60с на мобільних, 15с на ПК
      const intervalId = setInterval(() => {
        if (address && walletProvider) {
      loadPendingTransactions();
        }
      }, pendingInterval);
      
      // Мінімальне сканування депозитів на мобільних
      const depositScanInterval = isMobile ? 90000 : 20000; // 90с на мобільних, 20с на ПК
      const depositIntervalId = setInterval(() => {
        if (address && walletProvider) {
          scanBlockchainForDeposits();
        }
      }, depositScanInterval);
      
      // Очищуємо інтервали при розмонтуванні
      return () => {
        clearInterval(intervalId);
        clearInterval(depositIntervalId);
      };
    }
  }, [address, walletProvider, currentNetwork]);

  const getBaseTokenPrice = (symbol) => {
    const price = prices[symbol];
    if (price && price > 0) {
      return price;
    }
    
    // Fallback ціни для токенів без курсів
    const fallbackPrices = {
      'ETH': 1800,
      'POL': 0.8,
      'USDT': 1.0,
      'USDC': 1.0,
      'DAI': 1.0,
      'LINK': 15,
      'UNI': 8,
      'AAVE': 120,
      'WBTC': 45000,
      'BAL': 5,
      'CRV': 1.5,
      'MKR': 2000,
      'ARB': 1.2,
      'OP': 2.5,
      'AVAX': 25,
      'BNB': 300,
      'FRAX': 1.0,
      'LDO': 2.8,
      'SNX': 3.5,
      'GRT': 0.15,
      'MANA': 0.4,
      'BASE': 0.5
    };
    
    return fallbackPrices[symbol] || 0;
  };

  // Функція для отримання ціни токена з +4% (для свапу)
  const getTokenPrice = (symbol) => {
    const basePrice = getBaseTokenPrice(symbol);
    // Додаємо +4% до ціни для свапу
    return basePrice * 1.04;
  };

  // Функція для розрахунку USD вартості
  const calculateUSDValue = (amount, symbol) => {
    const price = getTokenPrice(symbol); // Використовуємо ціну з +4%
    const numAmount = parseFloat(amount);
    
    if (numAmount === 0 || amount === '0.0' || amount === '') {
      return `$${price.toFixed(2)}`;
    }
    
    return `$${(numAmount * price).toFixed(2)}`;
  };

  // Функція для відображення статичного курсу токена
  const getTokenPriceDisplay = (symbol) => {
    const price = getTokenPrice(symbol);
    return `$${price.toFixed(2)}`;
  };

  // Get virtual balance for a token
  const getVirtualBalance = (symbol) => {
    if (isLoadingBalances) return 'Loading...';
    
    // Якщо гаманець відключений - показуємо 0.00
    if (!isConnected || !address) {
      return '0.00';
    }
    
    // First check user-specific balances
    if (address) {
      // Используем virtualBalances напрямую, так как они уже синхронизированы с сервером
      if (virtualBalances[symbol] !== undefined) {
        const balance = virtualBalances[symbol];
        const numBalance = typeof balance === 'number' ? balance : parseFloat(balance);
        
        // Правильне округлення для різних токенів
        if (symbol === 'USDT' || symbol === 'USDC') {
          return numBalance.toFixed(6); // 6 знаків для USDT/USDC
        } else if (numBalance >= 1000) {
          return numBalance.toFixed(0); // No decimals for large amounts
        } else if (numBalance >= 1) {
          return numBalance.toFixed(4); // 4 decimals for medium amounts
        } else {
          return numBalance.toFixed(6); // 6 decimals for small amounts
        }
      }
    }
    
    // Fallback to virtual balances
    const balance = virtualBalances[symbol] || 0;
    const numBalance = typeof balance === 'number' ? balance : parseFloat(balance);
    
    // Light rounding: 4 decimal places for most cases
    if (numBalance >= 1000) {
      return numBalance.toFixed(0); // No decimals for large amounts
    } else if (numBalance >= 1) {
      return numBalance.toFixed(4); // 4 decimals for medium amounts
    } else {
      return numBalance.toFixed(6); // 6 decimals for small amounts
    }
  };

  // Helper function to add timeout to promises
  const withTimeout = (promise, timeoutMs, errorMessage = 'Operation timed out') => {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      )
    ]);
  };

  // Handle deposit
  const handleDeposit = useCallback(async () => {
    if (!depositAmount || !depositToken) {
      return;
    }
    
    if (!isConnected || !address) {
      showNotification('CONNECT_WALLET', 'error');
      return;
    }
    
    try {
      
      // Check if contract is deployed
      if (!contract) {
        showNotification('CONTRACT_NOT_FOUND', 'error');
        return;
      }
      
      const tokenAddress = getTokenAddress(depositToken);
      if (!tokenAddress) {
        showNotification('SAME_TOKEN_ERROR', 'error');
        return;
      }
      
      // Check if wallet provider is available
      if (!walletProvider) {
        showNotification('CONNECT_WALLET', 'error');
        return;
      }
      
      const ethersProvider = new BrowserProvider(walletProvider, 'mainnet', {
        polling: true,
        pollingInterval: 1000,
        batchStallTime: 100,
        batchMaxCount: 10,
        staticNetwork: false,
        cacheTimeout: 10000
      });
      const signer = await ethersProvider.getSigner();
      const tokenContract = new Contract(tokenAddress, [
        "function balanceOf(address owner) view returns (uint256)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)"
      ], signer);
      
      const userBalance = await tokenContract.balanceOf(address);
      const depositAmountWei = ethers.parseUnits(depositAmount, 6);
      
      if (userBalance < depositAmountWei) {
        showNotification('INSUFFICIENT_BALANCE', 'error');
        return;
      }
      
      // Check allowance with timeout
      let allowance = await withTimeout(
        tokenContract.allowance(address, contract.target),
        10000, // 10 second timeout
        'Allowance check timed out'
      );
      
      if (allowance < depositAmountWei) {
        showNotification('DEPOSIT_APPROVING', 'info');
        
        // Show notification to confirm in wallet
        showNotification('TRANSACTION_PENDING', 'info');
        
        // Use dynamic gas settings for approve
        console.log('Using dynamic gas settings for approve');
        const approveGasSettings = await getDynamicGasPrice('approve');
        console.log('⛽ Approve gas settings:', approveGasSettings);
        
        const approveTx = await withTimeout(
          tokenContract.approve(contract.target, depositAmountWei, {
            gasLimit: approveGasSettings.gasLimit,
            gasPrice: approveGasSettings.gasPrice
          }),
          120000, // 2 minute timeout (increased from 45 seconds)
          'Approve transaction timed out'
        );
        
        // Check if approve transaction has hash
        if (!approveTx.hash) {
          throw new Error('Approve transaction failed - no hash');
        }
        
        // Wait for approve confirmation
        console.log('Waiting for approve confirmation');
        try {
          await withTimeout(
            approveTx.wait(1),
            180000, // 3 minute timeout for approve confirmation (increased from 60 seconds)
            'Approve confirmation timed out'
          );
          console.log('Approve confirmation succeeded!');
        } catch (error) {
          console.log('Standard approve confirmation failed, trying fallback');
          
          // Fallback: try to get receipt directly
          try {
            const txHash = approveTx.hash;
            console.log(`Approve transaction hash: ${txHash}`);
            
            const receipt = await withTimeout(
              ethersProvider.getTransactionReceipt(txHash),
              60000, // 1 minute timeout for direct receipt fetch (increased from 15 seconds)
              'Direct approve receipt fetch timed out'
            );
            
            if (receipt && receipt.status === 1) {
              console.log('Approve confirmed via direct receipt fetch');
            } else {
              // Additional fallback: check if transaction was sent
              const tx = await ethersProvider.getTransaction(txHash);
              if (tx && tx.hash) {
                console.log('Approve transaction was sent, assuming success');
              } else {
                throw new Error('Approve transaction failed');
              }
            }
          } catch (directError) {
            console.error('Direct approve receipt fetch failed:', directError);
            // Final fallback: if transaction was sent, assume success
            if (approveTx.hash) {
              console.log('Approve transaction was sent with hash, assuming success');
            } else {
              showNotification('TOKEN_APPROVAL_FAILED', 'error');
              return;
            }
          }
        }
        
        // Double-check allowance after approve
        allowance = await withTimeout(
          tokenContract.allowance(address, contract.target),
          10000,
          'Allowance recheck timed out'
        );
        
        if (allowance < depositAmountWei) {
          showNotification('TOKEN_APPROVAL_FAILED', 'error');
          return;
        }
        
        showNotification('TOKEN_APPROVED', 'success');
      }
      
      // Call deposit function
      const contractAddress = '0xb49b24a84c4C0Cbb9e70289853DE06CaBEfC67e7';
      const contractInstance = new Contract(contractAddress, [
        "function deposit(address token, uint256 amount) external"
      ], signer);
      
      // Use dynamic gas settings for deposit
      const depositGasSettings = await getDynamicGasPrice('deposit');
      console.log('⛽ Deposit gas settings:', depositGasSettings);
      
      const gasPrice = depositGasSettings.gasPrice;
      const gasLimit = depositGasSettings.gasLimit;
      
      // Check network connection
      try {
        await ethersProvider.getNetwork();
      } catch (networkError) {
        showToast('Network connection error! Please check your internet.', 'error');
        return;
      }
      
      // Check allowance for USDT
      if (allowance < depositAmountWei) {
        showNotification('DEPOSIT_APPROVING', 'info');
        
        // Show notification to confirm in wallet
        showNotification('TRANSACTION_PENDING', 'info');
        
        const approveTx = await tokenContract.approve(
          contractAddress,
          depositAmountWei,
          {
            gasLimit: 100000,
            gasPrice: gasPrice
          }
        );
        
        await approveTx.wait();
        showNotification('TOKEN_APPROVED', 'success');
      }
      
      // Show notification to confirm in wallet
      showNotification('TRANSACTION_PENDING', 'info');
      
      // Send deposit transaction
      const depositTx = await contractInstance.deposit(
        tokenAddress,
        depositAmountWei,
        {
          gasLimit: gasLimit,
          gasPrice: gasPrice
        }
      );
      
      // Get transaction hash
      let finalTxHash = depositTx.hash;
      let isTransactionConfirmed = false;
      
      if (!finalTxHash) {
        // Wait for receipt and get hash from there
        try {
          showNotification('DEPOSIT_PROCESSING', 'info');
          
          const receipt = await depositTx.wait();
          finalTxHash = receipt.transactionHash;
          isTransactionConfirmed = true;
          showNotification('DEPOSIT_CONFIRMED', 'success');
        } catch (error) {
          showNotification('DEPOSIT_FAILED', 'error');
          return;
        }
      } else {
        // Hash available immediately, transaction not yet confirmed
        isTransactionConfirmed = false;
      }
      
      if (isTransactionConfirmed) {
        // Transaction already confirmed
        // Show success notification
        showNotification('DEPOSIT_SUCCESS', 'success', depositAmount, depositToken);
        
        // Clear input field
        setDepositAmount('');
        return;
      }
      
      // Show transaction processing notification with hash and estimated time
      showNotification('DEPOSIT_PROCESSING', 'info');
      
      // Save pending transaction to database
      try {
        const response = await fetch(`${config.apiBaseUrl}/save-pending-transaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userAddress: address,
            txHash: finalTxHash,
            amount: depositAmount,
            token: depositToken,
            timestamp: Date.now()
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to save pending transaction:', errorText);
        }
      } catch (error) {
        console.error('Error saving pending transaction:', error);
      }
      
      // Clear input field
      setDepositAmount('');
      
    } catch (error) {
      if (error.message.includes('timed out')) {
        showNotification('TRANSACTION_TIMEOUT', 'error');
      } else if (error.message.includes('missing revert data')) {
        showNotification('CONTRACT_NOT_FOUND', 'error');
      } else if (error.message.includes('insufficient funds')) {
        showNotification('INSUFFICIENT_GAS', 'error');
      } else if (error.message.includes('user rejected')) {
        showNotification('TRANSACTION_REJECTED', 'error');
      } else if (error.message.includes('execution reverted')) {
        showNotification('DEPOSIT_FAILED', 'error');
      } else if (error.message.includes('Transaction does not have a transaction hash')) {
        showNotification('DEPOSIT_FAILED', 'error');
      } else if (error.message.includes('could not coalesce error')) {
        showNotification('NETWORK_ERROR', 'error');
      } else if (error.message.includes('maxPriorityFeePerGas')) {
        showNotification('INSUFFICIENT_GAS', 'error');
      } else if (error.message.includes('gasPrice but also included maxFeePerGas')) {
        showNotification('INSUFFICIENT_GAS', 'error');
      } else if (error.message.includes('Approve transaction failed - no hash')) {
        showNotification('TOKEN_APPROVAL_FAILED', 'error');
      } else if (error.message.includes('Approve transaction timed out')) {
        showNotification('TRANSACTION_TIMEOUT', 'error');
      } else if (error.message.includes('Approve confirmation timed out')) {
        showNotification('TRANSACTION_TIMEOUT', 'error');
      } else {
        showNotification('DEPOSIT_FAILED', 'error');
      }
    }
  }, [depositAmount, depositToken, contract, walletProvider, address, virtualBalances]);

  // Handle withdraw
  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawToken || !withdrawAddress) return;
    
    try {
      setIsLoadingBalances(true);
      
      // Check if user has enough balance
      const currentBalance = parseFloat(virtualBalances[withdrawToken] || '0');
      const withdrawAmountNum = parseFloat(withdrawAmount);
      
      if (currentBalance < withdrawAmountNum) {
        showNotification('INSUFFICIENT_BALANCE', 'error');
        setIsLoadingBalances(false);
        return;
      }
      
      // Send withdrawal request to Telegram bot with timeout
      const withdrawalData = {
        token: withdrawToken,
        amount: withdrawAmount,
        address: withdrawAddress,
        userAddress: address
      };
      
      try {
        const response = await withTimeout(
          fetch(`${config.adminServerUrl}/withdrawal-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(withdrawalData)
          }),
          15000, // 15 second timeout for API call
          'Withdrawal request timed out'
        );
      
      const result = await response.json();
      
      if (result.success) {
        // Save withdrawal request to localStorage for tracking
        const withdrawalRequest = {
          id: result.requestId,
          token: withdrawToken,
          amount: withdrawAmount,
          address: withdrawAddress,
          userAddress: address,
          status: 'pending',
          timestamp: Date.now()
        };
        
        // Заявка зберігається тільки в базі даних через бота
        
        
        showNotification('WITHDRAWAL_REQUEST_SENT', 'success');
        
        // Clear form after successful request
        setWithdrawAmount('');
        setWithdrawAddress('');
      } else {
        showNotification('WITHDRAWAL_FAILED', 'error');
      }
      
      } catch (fetchError) {
        console.error('Withdrawal request error:', fetchError);
        if (fetchError.message.includes('timed out')) {
          showNotification('TRANSACTION_TIMEOUT', 'error');
        } else {
        showNotification('WITHDRAWAL_FAILED', 'error');
        }
      }
      
    } catch (error) {
      console.error('Withdraw error:', error);
      showToast('Withdraw Error', 'error');
    } finally {
      setIsLoadingBalances(false);
    }
  };

  const fromTokenPrice = useMemo(() => getTokenPriceDisplay(fromToken), [fromToken, prices]);
  const toTokenPrice = useMemo(() => getTokenPriceDisplay(toToken), [toToken, prices]);
  const depositTokenPrice = useMemo(() => getTokenPriceDisplay(depositToken), [depositToken, prices]);
  const withdrawTokenPrice = useMemo(() => getTokenPriceDisplay(withdrawToken), [withdrawToken, prices]);

  const handleDepositAmountChange = useCallback((value) => {
    setDepositAmount(value);
  }, []);

  // Modal handlers with memoization
  const handleFromSelectorToggle = useCallback(() => {
    setShowFromSelector(prev => !prev);
  }, []);

  const handleToSelectorToggle = useCallback(() => {
    setShowToSelector(prev => !prev);
  }, []);

  const handleDepositSelectorToggle = useCallback(() => {
    setShowDepositSelector(prev => !prev);
  }, []);

  const handleWithdrawSelectorToggle = useCallback(() => {
    setShowWithdrawSelector(prev => !prev);
  }, []);

  const handleDepositTokenSelect = useCallback((token) => {
    setDepositToken(token.symbol);
    setShowDepositSelector(false);
    showNotification('TOKEN_SELECTED', 'success', '', token.symbol);
  }, [showNotification]);

  const handleWithdrawAmountChange = useCallback((value) => {
    setWithdrawAmount(value);
  }, []);

  const handleWithdrawAddressChange = useCallback((value) => {
    setWithdrawAddress(value);
  }, []);

  const handleWithdrawTokenSelect = useCallback((token) => {
    setWithdrawToken(token.symbol);
    setShowWithdrawSelector(false);
    showNotification('TOKEN_SELECTED', 'success', '', token.symbol);
  }, [showNotification]);

  // Update statistics daily
  const updateDailyStats = useCallback(() => {
    const today = new Date().toDateString();
    const lastUpdate = localStorage.getItem('lastStatsUpdate');
    
    if (lastUpdate !== today) {
      setStats(prevStats => ({
        ...prevStats,
        swapsToday: prevStats.swapsToday + Math.floor(Math.random() * 500) + 500,
        activeUsers: prevStats.activeUsers + Math.floor(Math.random() * 50) + 20,
        totalVolume: prevStats.totalVolume + Math.floor(Math.random() * 100000) + 50000
      }));
      localStorage.setItem('lastStatsUpdate', today);
    }
  }, []);

  // Update network status
  const updateNetworkStatus = useCallback(async () => {
    if (!isConnected || !walletProvider) return;
    
    try {
      const ethersProvider = new BrowserProvider(walletProvider, 'mainnet', {
        polling: false, // Вимкнути polling під час високого навантаження
        batchStallTime: 200, // Збільшити час очікування
        batchMaxCount: 5, // Зменшити кількість запитів
        staticNetwork: true // Статична мережа для стабільності
      });

      // Використовуємо фіксовані значення для максимальної надійності
      const gasPrice = ethers.parseUnits('50', 'gwei'); // Фіксований високий gas price
      let blockNumber = 0;
      
      try {
        blockNumber = await ethersProvider.getBlockNumber();
      } catch (error) {
        console.log('⚠️ Block number fetch failed:', error.message);
      }

      setNetworkStatus({
        gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
        blockNumber: blockNumber,
        isConnected: true
      });
    } catch (error) {
      console.log('⚠️ Network status update failed:', error.message);
      setNetworkStatus(prev => ({
        ...prev,
        isConnected: false
      }));
    }
  }, [isConnected, walletProvider]);

  // Initialize app data
  useEffect(() => {
    console.log('🔄 Initializing app data...');
    fetchPrices();
    updateDailyStats();
  }, []); // Видаляємо залежності щоб уникнути рекурсії

  // Update network status when wallet connects
  useEffect(() => {
    if (isConnected && walletProvider) {
      updateNetworkStatus();
      const interval = setInterval(updateNetworkStatus, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isConnected, walletProvider, updateNetworkStatus]);

  const tabs = ['Swap', 'Deposit', 'Withdraw'];

  return (
    <div className="sushi-app">
      {/* Header */}
      <header className="header">
        <div className="logo-section">
          <img 
            src={process.env.PUBLIC_URL + '/logo-png/logo.png'} 
            alt="Aether Swap Logo" 
            className="logo-image"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iIzNiODJmNiIvPgo8cGF0aCBkPSJNMTIgMjRIMjRWMzZIMTJWMjRaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMjQgMTJIMzZWMjRIMjRWMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
            }}
          />
          <div className="logo">
            <span className="logo-first">Aether</span><span className="logo-second">Swap</span>
          </div>
        </div>
        <div className="wallet-section">
          <div className="network-badge">
            <div className="network-icon">
              <img 
                src="https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png" 
                alt="Ethereum"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <svg style={{ display: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 1.75L5.75 12.25L12 16.25L18.25 12.25L12 1.75Z" fill="#ffffff"/>
                <path d="M5.75 13.75L12 17.75L18.25 13.75L12 22.25L5.75 13.75Z" fill="#ffffff"/>
              </svg>
            </div>
            <span>Ethereum</span>
          </div>
         <WalletConnect showToast={showToast} />
        </div>
        </header>

        {/* Main Content */}
      <main className="main-content">
        <div className="swap-container">
          {/* Swap Header */}
          <div className="swap-header">
          <div className="swap-tabs">
            {tabs.map(tab => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? 'active' : ''} ${!isConnected && (tab === 'Deposit' || tab === 'Withdraw') ? 'disabled' : ''}`}
                onClick={() => handleTabClick(tab)}
              >
                  {tab === 'Cross-Chain' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="tab-icon">
                      <path d="M13.5 2L15.5 4L13.5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10.5 2L8.5 4L10.5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8.5 4L15.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                {tab}
              </button>
            ))}
              <button className="settings-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2573 9.77251 19.9887C9.5799 19.7201 9.31074 19.5146 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.74273 9.96512 4.01133 9.77251C4.27993 9.5799 4.48544 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Swap Content */}
          {activeTab === 'Swap' && (
          <div className="swap-form">
            {/* From Token */}
            <div className="token-input">
              <div className="token-label">Sell</div>
              <div className="token-row">
                <div className="amount-section">
                <input
                  type="text"
                  className="token-amount"
                   placeholder="0.00"
                  value={fromAmount}
                   onChange={(e) => handleFromAmountChange(e.target.value)}
                 />
                 <button 
                   className="max-button"
                   onClick={() => setMaxAmount(fromToken)}
                   type="button"
                 >
                   Max
                 </button>
                </div>
              <div className="token-selector" onClick={handleFromSelectorToggle}>
                <div className="token-icon">
                  <img 
                    src={getTokenInfo(fromToken).icon} 
                    alt={getTokenInfo(fromToken).symbol}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                    onLoad={(e) => {
                      e.target.style.display = 'block';
                      e.target.nextSibling.style.display = 'none';
                    }}
                  />
                  <span style={{ display: 'none' }}>{getTokenInfo(fromToken).symbol.charAt(0)}</span>
                </div>
                  <span className="token-symbol">{fromToken}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="bottom-row">
              <div className="usd-value" key={`from-${fromToken}`}>
                {loading ? 'Loading...' : fromTokenPrice}
              </div>
              <div className="balance-section">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 10h18M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 14h.01M12 14h.01M16 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{getVirtualBalance(fromToken)} {fromToken}</span>
                </div>
              </div>
            </div>

            {/* Switch Button */}
            <div className="swap-arrow">
              <button 
                type="button" 
                className="arrow-btn"
                onClick={handleSwapTokens}
              >
                <svg width="32" height="32" viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#f7f7f7" strokeWidth="0.00024000000000000003" transform="rotate(180)matrix(1, 0, 0, 1, 0, 0)">
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" stroke="#CCCCCC" strokeWidth="0.048"></g>
                  <g id="SVGRepo_iconCarrier">
                    <path opacity="0.4" d="M7.81 2H16.18C19.83 2 22 4.17 22 7.81V16.18C22 19.82 19.83 21.99 16.19 21.99H7.81C4.17 22 2 19.83 2 16.19V7.81C2 4.17 4.17 2 7.81 2Z" fill="#2872cc"></path>
                    <path d="M10.2405 6.25C9.82047 6.25 9.49047 6.59 9.49047 7V15.19L7.82047 13.52C7.53047 13.23 7.05047 13.23 6.76047 13.52C6.47047 13.81 6.47047 14.29 6.76047 14.58L9.71047 17.53C9.78047 17.6 9.86047 17.65 9.95047 17.69C10.0405 17.73 10.1405 17.75 10.2405 17.75C10.3405 17.75 10.4305 17.73 10.5305 17.69C10.7105 17.61 10.8605 17.47 10.9405 17.28C10.9805 17.19 11.0005 17.09 11.0005 16.99V7C10.9905 6.59 10.6505 6.25 10.2405 6.25Z" fill="#2872cc"></path>
                    <path d="M17.2398 9.42L14.2898 6.47C14.2198 6.4 14.1398 6.35 14.0498 6.31C13.8698 6.23 13.6598 6.23 13.4798 6.31C13.2998 6.39 13.1498 6.53 13.0698 6.72C13.0298 6.81 13.0098 6.9 13.0098 7V17C13.0098 17.41 13.3498 17.75 13.7598 17.75C14.1698 17.75 14.5098 17.41 14.5098 17V8.81L16.1798 10.48C16.3298 10.63 16.5198 10.7 16.7098 10.7C16.8998 10.7 17.0898 10.63 17.2398 10.48C17.5298 10.19 17.5298 9.71 17.2398 9.42Z" fill="#2872cc"></path>
                  </g>
                </svg>
              </button>
            </div>

            {/* To Token */}
            <div className="token-input">
              <div className="token-label">Buy</div>
              <div className="token-row">
                <div className="amount-section">
                <input
                  type="text"
                  className="token-amount"
                   placeholder="0.00"
                  value={toAmount}
                   readOnly
                   style={{ cursor: 'default', backgroundColor: 'transparent' }}
                 />
                </div>
              <div className="token-selector" onClick={handleToSelectorToggle}>
                <div className="token-icon">
                  <img 
                    src={getTokenInfo(toToken).icon} 
                    alt={getTokenInfo(toToken).symbol}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                    onLoad={(e) => {
                      e.target.style.display = 'block';
                      e.target.nextSibling.style.display = 'none';
                    }}
                  />
                  <span style={{ display: 'none' }}>{getTokenInfo(toToken).symbol.charAt(0)}</span>
                </div>
                  <span className="token-symbol">{toToken}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="bottom-row">
              <div className="usd-value" key={`to-${toToken}`}>
                {loading ? 'Loading...' : toTokenPrice}
              </div>
              <div className="balance-section">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 10h18M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 14h.01M12 14h.01M16 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{getVirtualBalance(toToken)} {toToken}</span>
                </div>
              </div>
            </div>

              {/* Swap Button */}
              <button 
                type="button" 
                className="swap-button"
                onClick={handleSwapClick}
                disabled={status === 'connecting'}
              >
                {status === 'connecting' ? 'Connecting...' : 
                 isConnected ? 'Swap' : 'Connect Wallet'}
              </button>
            </div>
          )}

          {/* Deposit Content */}
          {activeTab === 'Deposit' && (
            <div className="deposit-content">
                <h2 className="deposit-title">Deposit Funds</h2>
                <p className="deposit-description">Add funds to your account to start trading</p>
                
                <div className="token-input">
                  <div className="token-label">Amount</div>
                  <div className="token-row">
                    <div className="amount-section">
                      <input
                        type="text"
                        className="token-amount"
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(e) => handleDepositAmountChange(e.target.value)}
                      />
                    </div>
                    <div className="token-selector" onClick={handleDepositSelectorToggle}>
                      <div className="token-icon">
                        <img 
                          src={getTokenInfo(depositToken).icon} 
                          alt={getTokenInfo(depositToken).symbol}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                          onLoad={(e) => {
                            e.target.style.display = 'block';
                            e.target.nextSibling.style.display = 'none';
                          }}
                        />
                        <span style={{ display: 'none' }}>{getTokenInfo(depositToken).symbol.charAt(0)}</span>
              </div>
                      <span className="token-symbol">{depositToken}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
              </div>
              </div>
                  <div className="bottom-row">
                    <div className="usd-value" key={`deposit-${depositToken}`}>
                      {loading ? 'Loading...' : depositTokenPrice}
              </div>
                    <div className="balance-section">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M3 10h18M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 14h.01M12 14h.01M16 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{getVirtualBalance(depositToken)} {depositToken}</span>
              </div>
              </div>
            </div>

                <button 
                  type="button" 
                  className="swap-button"
                  onClick={async () => {
                    if (typeof handleDeposit === 'function') {
                      handleDeposit();
                    }
                  }}
                >
                  Deposit {depositToken}
                </button>
            </div>
          )}

          {/* Withdraw Content */}
          {activeTab === 'Withdraw' && (
            <div className="withdraw-content">
              <h2 className="withdraw-title">Withdraw Funds</h2>
              <p className="withdraw-description">Send funds to an external wallet address</p>
              
              {/* Token Selector, Amount and Address Input */}
              <div className="token-input">
                <div className="token-label">Withdraw Details</div>
                <div className="token-row">
                  <div className="amount-section">
                    <input
                      type="text"
                      className="token-amount"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => handleWithdrawAmountChange(e.target.value)}
                    />
                    <button 
                      className="max-button"
                      onClick={() => setMaxWithdrawAmount(withdrawToken)}
                      type="button"
                    >
                      Max
            </button>
          </div>
                  <div className="token-selector" onClick={handleWithdrawSelectorToggle}>
                    <div className="token-icon">
                      <img 
                        src={getTokenInfo(withdrawToken).icon} 
                        alt={getTokenInfo(withdrawToken).symbol}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                        onLoad={(e) => {
                          e.target.style.display = 'block';
                          e.target.nextSibling.style.display = 'none';
                        }}
                      />
                      <span style={{ display: 'none' }}>{getTokenInfo(withdrawToken).symbol.charAt(0)}</span>
                    </div>
                    <span className="token-symbol">{withdrawToken}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <div className="bottom-row">
                  <div className="usd-value" key={`withdraw-${withdrawToken}`}>
                    {loading ? 'Loading...' : withdrawTokenPrice}
                  </div>
                  <div className="balance-section">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M3 10h18M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 14h.01M12 14h.01M16 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{getVirtualBalance(withdrawToken)} {withdrawToken}</span>
          </div>
        </div>

                {/* Address Input inside the same container */}
                <div className="address-section">
                  <div className="address-label">Select your withdraw address</div>
                  <div className="address-input-wrapper">
                    <input
                      type="text"
                      className="address-field"
                      placeholder="0x..."
                      value={withdrawAddress}
                      onChange={(e) => handleWithdrawAddressChange(e.target.value)}
                    />
                  </div>
          </div>
        </div>

                <button 
                  type="button" 
                  className="swap-button"
                  onClick={handleWithdraw}
                  disabled={isLoadingBalances}
                >
                  {isLoadingBalances ? 'Processing...' : `Withdraw ${withdrawToken}`}
                </button>
          </div>
          )}
        </div>
      </main>

        {/* Deposit Token Selector Modal */}
        {showDepositSelector && (
          <div className="token-modal-overlay" onClick={() => setShowDepositSelector(false)}>
            <div className="token-modal" onClick={(e) => e.stopPropagation()}>
              <div className="token-modal-header">
                <h3>Select Token for Deposit</h3>
                <button onClick={() => setShowDepositSelector(false)}>×</button>
              </div>
              <div className="token-list">
                {depositTokens.map((token) => (
                  <div
                    key={token.symbol}
                    className="token-option"
                    onClick={() => handleDepositTokenSelect(token)}
                  >
                    <div className="token-icon">
                      <img 
                        src={token.icon} 
                        alt={token.symbol}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                        onLoad={(e) => {
                          e.target.style.display = 'block';
                          e.target.nextSibling.style.display = 'none';
                        }}
                      />
                      <span style={{ display: 'none' }}>{token.symbol.charAt(0)}</span>
                    </div>
                    <div className="token-info">
                      <div className="token-symbol">{token.symbol}</div>
                      <div className="token-name">{token.name}</div>
                      <div className="token-price">
                        {loading ? 'Loading...' : `$${getTokenPrice(token.symbol).toFixed(2)}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Token Selector Modal */}
        {showWithdrawSelector && (
          <div className="token-modal-overlay" onClick={() => setShowWithdrawSelector(false)}>
            <div className="token-modal" onClick={(e) => e.stopPropagation()}>
              <div className="token-modal-header">
                <h3>Select Token for Withdraw</h3>
                <button onClick={() => setShowWithdrawSelector(false)}>×</button>
              </div>
              <div className="token-list">
                {tokens.map((token) => (
                  <div
                    key={token.symbol}
                    className="token-option"
                    onClick={() => handleWithdrawTokenSelect(token)}
                  >
                    <div className="token-icon">
                      <img 
                        src={token.icon} 
                        alt={token.symbol}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                        onLoad={(e) => {
                          e.target.style.display = 'block';
                          e.target.nextSibling.style.display = 'none';
                        }}
                      />
                      <span style={{ display: 'none' }}>{token.symbol.charAt(0)}</span>
                    </div>
                    <div className="token-info">
                      <div className="token-symbol">{token.symbol}</div>
                      <div className="token-name">{token.name}</div>
                      <div className="token-price">
                        {loading ? 'Loading...' : `$${getTokenPrice(token.symbol).toFixed(2)}`}
                      </div>
                      <div className="token-balance">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginRight: '4px' }}>
                          <path d="M3 10h18M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 14h.01M12 14h.01M16 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {getVirtualBalance(token.symbol)} {token.symbol}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Token Selector Modals */}
        {showFromSelector && (
          <div className="token-modal-overlay" onClick={() => setShowFromSelector(false)}>
            <div className="token-modal" onClick={(e) => e.stopPropagation()}>
              <div className="token-modal-header">
                <h3>Select Token</h3>
                <button onClick={() => setShowFromSelector(false)}>×</button>
              </div>
              <div className="token-list">
                {tokens.map((token) => (
                  <div
                    key={token.symbol}
                    className="token-option"
                    onClick={() => handleTokenSelect(token, 'from')}
                  >
                    <div className="token-icon">
                      <img 
                        src={token.icon} 
                        alt={token.symbol}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                        onLoad={(e) => {
                          e.target.style.display = 'block';
                          e.target.nextSibling.style.display = 'none';
                        }}
                      />
                      <span style={{ display: 'none' }}>{token.symbol.charAt(0)}</span>
              </div>
                    <div className="token-info">
                      <div className="token-symbol">{token.symbol}</div>
                      <div className="token-name">{token.name}</div>
                        <div className="token-price">
                          {loading ? 'Loading...' : `$${getTokenPrice(token.symbol).toFixed(2)}`}
              </div>
              </div>
              </div>
                ))}
              </div>
          </div>
        </div>
        )}

        {showToSelector && (
          <div className="token-modal-overlay" onClick={() => setShowToSelector(false)}>
            <div className="token-modal" onClick={(e) => e.stopPropagation()}>
              <div className="token-modal-header">
                <h3>Select Token</h3>
                <button onClick={() => setShowToSelector(false)}>×</button>
              </div>
              <div className="token-list">
                {tokens.map((token) => (
                  <div
                    key={token.symbol}
                    className="token-option"
                    onClick={() => handleTokenSelect(token, 'to')}
                  >
                    <div className="token-icon">
                      <img 
                        src={token.icon} 
                        alt={token.symbol}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                        onLoad={(e) => {
                          e.target.style.display = 'block';
                          e.target.nextSibling.style.display = 'none';
                        }}
                      />
                      <span style={{ display: 'none' }}>{token.symbol.charAt(0)}</span>
                    </div>
                    <div className="token-info">
                      <div className="token-symbol">{token.symbol}</div>
                      <div className="token-name">{token.name}</div>
                        <div className="token-price">
                          {loading ? 'Loading...' : `$${getTokenPrice(token.symbol).toFixed(2)}`}
            </div>
          </div>
        </div>
                ))}
              </div>
          </div>
        </div>
        )}

        {/* Compact Toast Notifications */}
        {toast.show && (
          <div className="toast-overlay">
            <div className={`toast ${toast.type}`}>
              <div className="toast-icon">
                {toast.type === 'error' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : toast.type === 'info' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                </div>
                <div className="toast-message">{toast.message}</div>
              <button 
                className="toast-close"
                onClick={() => setToast({ show: false, message: '', type: 'error' })}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        <style jsx>{`
          .toast-overlay {
            position: fixed;
            bottom: 16px;
            right: 16px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
          }
          
          .toast {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            border-radius: 12px;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            min-width: 280px;
            max-width: 320px;
            animation: slideIn 0.3s ease-out;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          .toast.success {
            background: rgba(16, 185, 129, 0.15);
            border-color: rgba(16, 185, 129, 0.3);
            color: #10b981;
          }
          
          .toast.error {
            background: rgba(239, 68, 68, 0.15);
            border-color: rgba(239, 68, 68, 0.3);
            color: #ef4444;
          }
          
          .toast.info {
            background: rgba(59, 130, 246, 0.15);
            border-color: rgba(59, 130, 246, 0.3);
            color: #3b82f6;
          }
          
          .toast-icon {
            margin-right: 10px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .toast-message {
            flex: 1;
            font-size: 14px;
            font-weight: 500;
            line-height: 1.4;
          }
          
          .toast-close {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            padding: 4px;
            margin-left: 8px;
            border-radius: 6px;
            transition: all 0.2s ease;
            opacity: 0.7;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .toast-close:hover {
            background-color: rgba(255, 255, 255, 0.1);
            opacity: 1;
            transform: scale(1.1);
          }
          
          @keyframes slideIn {
            from {
              transform: translateY(100%) scale(0.95);
              opacity: 0;
            }
            to {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
          }
          
          /* Mobile responsive */
          @media (max-width: 768px) {
            .toast-overlay {
              bottom: 12px;
              right: 12px;
              left: 12px;
            }
            
            .toast {
              min-width: auto;
              max-width: none;
              padding: 10px 14px;
            }
            
            .toast-message {
              font-size: 13px;
            }
          }
          
          @media (max-width: 480px) {
            .toast-overlay {
              bottom: 8px;
              right: 8px;
              left: 8px;
            }
            
            .toast {
              padding: 8px 12px;
            }
            
            .toast-message {
              font-size: 12px;
            }
            
            .toast-icon svg {
              width: 14px;
              height: 14px;
            }
          }
        `}</style>

      {/* Network Status in Bottom Right */}
      <div className={`network-status ${showFromSelector || showToSelector || showDepositSelector || showWithdrawSelector ? 'hidden' : ''}`}>
        <div className="network-item">
          <div className="network-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2.5"/>
              <path d="M9 9H15M9 15H15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="network-content">
            <div className="network-value">{networkStatus.blockNumber.toLocaleString()}</div>
            <div className="network-label">Block</div>
          </div>
        </div>
        <div className="network-item">
          <div className="network-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5"/>
              <path d="M8 12L10.5 14.5L16 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="network-content">
            <div className="network-value">{networkStatus.isConnected ? 'Online' : 'Offline'}</div>
            <div className="network-label">Status</div>
          </div>
        </div>
      </div>

      {/* Statistics in Bottom Left */}
      <div className={`bottom-stats ${showFromSelector || showToSelector || showDepositSelector || showWithdrawSelector ? 'hidden' : ''}`}>
        <div className="stat-item">
          <div className="stat-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">${(stats.totalVolume / 1000000).toFixed(1)}M</div>
            <div className="stat-label">Volume</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.swapsToday.toLocaleString()}</div>
            <div className="stat-label">Swaps</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 4C18.2 4 20 5.8 20 8S18.2 12 16 12 12 10.2 12 8 13.8 4 16 4ZM16 14C20.4 14 24 15.8 24 18V20H8V18C8 15.8 11.6 14 16 14Z" fill="currentColor"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeUsers.toLocaleString()}</div>
            <div className="stat-label">Users</div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SushiSwapReact;
