# 🚀 DeFi Exchange Platform

A decentralized exchange platform with USDT deposits, virtual swaps with 3-4% markup, and Telegram bot integration for withdrawal requests.

## ✨ **Features**

- 🔗 **WalletConnect Integration** - Connect with MetaMask, Trust Wallet, and more
- 💰 **USDT ERC20 Deposits** - Direct deposits to smart contract
- 🔄 **Virtual Swaps** - Trade with 3-4% markup (4% bonus for ETH)
- 📱 **Telegram Bot** - Withdrawal requests with approve/reject functionality
- 🛡️ **Admin Panel** - Contract balance management and fund withdrawal
- 🔒 **Security** - Protection against duplicate deposits and server restarts

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │  Telegram Bot   │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Node.js)     │
│                 │    │                 │    │                 │
│ • WalletConnect │    │ • API Endpoints │    │ • Withdrawal    │
│ • Virtual Swap  │    │ • Balance Mgmt  │    │   Requests      │
│ • Admin Panel   │    │ • Blockchain    │    │ • Approve/Reject│
│                 │    │   Scanning      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Smart Contract│    │   Database      │
│   (Ethereum)    │    │   (JSON Files)  │
│                 │    │                 │
│ • USDT Deposits │    │ • User Balances │
│ • Admin Withdraw│    │ • Transactions  │
│ • Virtual Swap  │    │ • Withdrawals   │
└─────────────────┘    └─────────────────┘
```

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+
- npm 8+
- Git
- MetaMask or compatible wallet

### **Installation**

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd defi-exchange
```

2. **Install dependencies:**
```bash
npm run install-all
```

3. **Start development servers:**
```bash
npm run dev
```

4. **Access the application:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3002
- Admin Panel: http://localhost:3000/alex

## 📱 **Usage**

### **1. Connect Wallet**
- Click "Connect Wallet" button
- Choose your preferred wallet (MetaMask, Trust Wallet, etc.)
- Approve the connection

### **2. Deposit USDT**
- Go to "Deposit" tab
- Enter USDT amount
- Approve token spending
- Confirm deposit transaction
- Wait for blockchain confirmation

### **3. Virtual Swap**
- Go to "Swap" tab
- Select tokens to swap
- Enter amount
- Click "Swap" (no blockchain transaction needed)
- Enjoy 3-4% markup!

### **4. Withdraw Funds**
- Go to "Withdraw" tab
- Enter amount and crypto address
- Submit withdrawal request
- Admin will process via Telegram bot

## 🤖 **Telegram Bot Setup**

### **1. Create Bot**
1. Message @BotFather on Telegram
2. Send `/newbot`
3. Follow instructions
4. Save the bot token

### **2. Get Chat ID**
1. Add bot to your group/channel
2. Send `/start` to the bot
3. Visit: `https://api.telegram.org/bot<TOKEN>/getUpdates`
4. Find your chat ID

### **3. Configure Environment**
```bash
TELEGRAM_BOT_TOKEN=your_bot_token
ADMIN_CHAT_ID=your_chat_id
```

## 🛡️ **Admin Panel**

Access admin panel at `/alex` route:

### **Features:**
- View contract balances
- Withdraw funds from contract
- Monitor user activities
- Manage withdrawal requests

### **Admin Functions:**
- `adminWithdraw()` - Withdraw specific amount
- `adminWithdrawAll()` - Withdraw all funds
- `emergencyWithdraw()` - Emergency withdrawal

## 🔧 **Configuration**

### **Environment Variables**

#### **Frontend (.env)**
```bash
REACT_APP_API_URL=http://localhost:3002
REACT_APP_TELEGRAM_BOT_URL=http://localhost:3001
```

#### **Backend (.env)**
```bash
PORT=3002
NODE_ENV=development
ETHERSCAN_API_KEY=your_etherscan_key
TELEGRAM_BOT_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

#### **Telegram Bot (.env)**
```bash
TELEGRAM_BOT_TOKEN=your_bot_token
ADMIN_CHAT_ID=your_chat_id
BACKEND_URL=http://localhost:3002
```

### **Smart Contract**
- **Contract Address:** `0xb49b24a84c4C0Cbb9e70289853DE06CaBEfC67e7`
- **USDT Address:** `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- **Network:** Ethereum Mainnet

## 📊 **API Endpoints**

### **Backend API**
- `GET /api/balances/:userAddress` - Get user balances
- `POST /api/sync-balances` - Sync balances
- `POST /api/save-transaction` - Save transaction
- `GET /api/gas-price` - Get dynamic gas prices
- `GET /api/server-state` - Get server state
- `DELETE /api/clear-pending-transactions/:userAddress` - Clear pending transactions

### **Telegram Bot API**
- `POST /withdrawal-request` - Submit withdrawal request
- `GET /withdrawal-status/:requestId` - Check withdrawal status

## 🚀 **Deployment**

### **Render Deployment**
See [RENDER_DEPLOYMENT_GUIDE.md](RENDER_DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### **Quick Deploy**
```bash
./deploy.sh
```

## 🔒 **Security Features**

- **Duplicate Protection** - Prevents double crediting
- **Server Restart Protection** - Maintains state across restarts
- **Transaction Validation** - Verifies all blockchain transactions
- **Admin Controls** - Secure admin functions
- **Rate Limiting** - Prevents spam attacks

## 📈 **Performance**

- **Fast Swaps** - Virtual swaps without blockchain fees
- **Real-time Updates** - Live balance updates
- **Efficient Scanning** - Optimized blockchain scanning
- **Caching** - Smart caching for better performance

## 🛠️ **Development**

### **Project Structure**
```
defi-exchange/
├── src/                    # Frontend React app
│   ├── components/         # React components
│   ├── SushiSwapReact.jsx  # Main app component
│   └── package.json        # Frontend dependencies
├── telegram-bot/           # Telegram bot
│   ├── bot.js             # Bot logic
│   └── package.json       # Bot dependencies
├── contracts/             # Smart contracts
│   └── DepositContract.sol
├── database/              # JSON database files
├── admin-server.js        # Backend server
├── package.json           # Root dependencies
└── render.yaml           # Render deployment config
```

### **Scripts**
```bash
npm start          # Start backend server
npm run dev        # Start all services
npm run client     # Start frontend only
npm run bot        # Start bot only
npm run build      # Build frontend
npm run install-all # Install all dependencies
```

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Wallet Connection Failed**
- Check if MetaMask is installed
- Ensure you're on Ethereum mainnet
- Try refreshing the page

#### **Deposit Not Credited**
- Check transaction on Etherscan
- Wait for blockchain confirmation
- Contact admin if issue persists

#### **Telegram Bot Not Responding**
- Verify bot token is correct
- Check if bot is added to group
- Ensure chat ID is correct

#### **Swap Not Working**
- Check if you have sufficient balance
- Verify token selection
- Try refreshing the page

## 📞 **Support**

For support and questions:
- Check the troubleshooting section
- Review the deployment guide
- Contact the development team

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 **Acknowledgments**

- [Reown AppKit](https://docs.reown.com/appkit) for wallet connection
- [Ethers.js](https://docs.ethers.io/) for blockchain interaction
- [Telegram Bot API](https://core.telegram.org/bots/api) for bot functionality
- [Render](https://render.com) for hosting

---

**Built with ❤️ for the DeFi community**
