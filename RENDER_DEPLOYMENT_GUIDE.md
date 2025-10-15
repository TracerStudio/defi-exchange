# 🚀 DeFi Exchange - Render Deployment Guide

## 📋 **Що потрібно для деплою:**

### **1. GitHub Repository**
- Завантажте код на GitHub
- Переконайтеся що всі файли завантажені

### **2. Telegram Bot**
- Створіть бота через @BotFather
- Отримайте токен бота
- Додайте бота в групу/канал
- Отримайте Chat ID

### **3. Render Account**
- Зареєструйтеся на [render.com](https://render.com)
- Підключіть GitHub репозиторій

---

## 🔧 **Крок 1: Підготовка Telegram Bot**

### **Створення бота:**
1. Напишіть @BotFather в Telegram
2. Відправте `/newbot`
3. Введіть назву бота: `DeFi Exchange Bot`
4. Введіть username: `defi_exchange_bot`
5. **Збережіть токен!**

### **Отримання Chat ID:**
1. Додайте бота в групу/канал
2. Напишіть боту `/start`
3. Перейдіть на: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Знайдіть `"chat":{"id":-1001234567890}` - це ваш Chat ID

---

## 🌐 **Крок 2: Деплой на Render**

### **2.1 Frontend (React App)**

1. **Створіть новий Web Service:**
   - Type: `Static Site`
   - Name: `defi-exchange-frontend`
   - Build Command: `cd src && npm install --legacy-peer-deps && npm run build`
   - Publish Directory: `src/build`

2. **Environment Variables:**
   ```
   REACT_APP_API_URL=https://defi-exchange-backend.onrender.com
   REACT_APP_TELEGRAM_BOT_URL=https://defi-exchange-bot.onrender.com
   ```

3. **Deploy:** Натисніть `Create Web Service`

### **2.2 Backend Server**

1. **Створіть новий Web Service:**
   - Type: `Web Service`
   - Name: `defi-exchange-backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node admin-server.js`

2. **Environment Variables:**
   ```
   PORT=3002
   NODE_ENV=production
   ETHERSCAN_API_KEY=T16BIYS9V6EPNPZG5TD6T9TXZIX75F1C5F
   TELEGRAM_BOT_URL=https://defi-exchange-bot.onrender.com
   FRONTEND_URL=https://defi-exchange-frontend.onrender.com
   ```

3. **Deploy:** Натисніть `Create Web Service`

### **2.3 Telegram Bot**

1. **Створіть новий Background Worker:**
   - Type: `Background Worker`
   - Name: `defi-exchange-bot`
   - Environment: `Node`
   - Build Command: `cd telegram-bot && npm install`
   - Start Command: `cd telegram-bot && node bot.js`

2. **Environment Variables:**
   ```
   TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
   ADMIN_CHAT_ID=YOUR_ADMIN_CHAT_ID
   BACKEND_URL=https://defi-exchange-backend.onrender.com
   ```

3. **Deploy:** Натисніть `Create Background Worker`

---

## ⚙️ **Крок 3: Налаштування**

### **3.1 Оновлення URL в коді:**
Після деплою оновіть URL в `render.yaml`:
```yaml
services:
  - type: web
    name: defi-exchange-frontend
    envVars:
      - key: REACT_APP_API_URL
        value: https://YOUR-ACTUAL-BACKEND-URL.onrender.com
```

### **3.2 Перевірка роботи:**
1. **Frontend:** Відкрийте URL фронтенду
2. **Backend:** Перевірте `/health` endpoint
3. **Bot:** Напишіть боту `/start`

---

## 🔍 **Крок 4: Тестування**

### **4.1 Тест підключення гаманця:**
1. Відкрийте фронтенд
2. Натисніть "Connect Wallet"
3. Підключіть MetaMask

### **4.2 Тест депозиту:**
1. Перейдіть на вкладку "Deposit"
2. Введіть суму USDT
3. Підтвердіть транзакцію

### **4.3 Тест свапу:**
1. Перейдіть на вкладку "Swap"
2. Оберіть токени
3. Введіть суму
4. Натисніть "Swap"

### **4.4 Тест виводу:**
1. Перейдіть на вкладку "Withdraw"
2. Введіть суму та адресу
3. Перевірте заявку в Telegram

---

## 🛠️ **Крок 5: Адмін панель**

### **Доступ до адмін панелі:**
1. Відкрийте: `https://YOUR-FRONTEND-URL.onrender.com/alex`
2. Підключіть гаманець адміна
3. Перевірте баланси контракту
4. Протестуйте вивід коштів

---

## 📊 **Моніторинг**

### **Логи Render:**
- Frontend: `Dashboard > defi-exchange-frontend > Logs`
- Backend: `Dashboard > defi-exchange-backend > Logs`
- Bot: `Dashboard > defi-exchange-bot > Logs`

### **Метрики:**
- CPU використання
- Memory використання
- Response time
- Error rate

---

## 🚨 **Troubleshooting**

### **Проблема: Frontend не підключається до Backend**
**Рішення:**
1. Перевірте CORS налаштування
2. Переконайтеся що Backend запущений
3. Перевірте Environment Variables

### **Проблема: Telegram Bot не відповідає**
**Рішення:**
1. Перевірте токен бота
2. Переконайтеся що бот доданий в групу
3. Перевірте Chat ID

### **Проблема: Депозити не нараховуються**
**Рішення:**
1. Перевірте Etherscan API ключ
2. Переконайтеся що контракт розгорнутий
3. Перевірте логи Backend

---

## 💰 **Вартість Render**

### **Starter Plan (Безкоштовно):**
- 750 годин на місяць
- Sleep після 15 хвилин неактивності
- Підходить для тестування

### **Hobby Plan ($7/місяць):**
- 24/7 робота
- Кращі ресурси
- Рекомендується для продакшену

---

## 🎯 **Готово!**

Після виконання всіх кроків ваш DeFi Exchange буде працювати на Render:

- **Frontend:** `https://defi-exchange-frontend.onrender.com`
- **Backend:** `https://defi-exchange-backend.onrender.com`
- **Bot:** `https://defi-exchange-bot.onrender.com`

**Успішного деплою! 🚀**
