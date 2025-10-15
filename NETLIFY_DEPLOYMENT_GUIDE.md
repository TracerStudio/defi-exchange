# 🟢 Netlify Deployment Guide for Telegram Bot

## 📋 **Що потрібно:**

### **1. Netlify Account**
- Зареєструйтеся на [netlify.com](https://netlify.com)
- Підключіть GitHub репозиторій

### **2. Telegram Bot (якщо ще не створений)**
- Створіть бота через @BotFather
- Отримайте токен бота
- Додайте бота в групу/канал
- Отримайте Chat ID

---

## 🚀 **Крок 1: Деплой на Netlify**

### **1.1 Створення сайту:**
1. Перейдіть на [netlify.com](https://netlify.com)
2. Натисніть **"New site from Git"**
3. Виберіть **"GitHub"**
4. Виберіть ваш репозиторій `defi-exchange`

### **1.2 Налаштування збірки:**
1. **Base directory:** `telegram-bot`
2. **Build command:** `npm install && npm run build`
3. **Publish directory:** `dist` (або залиште порожнім)
4. Натисніть **"Deploy site"**

### **1.3 Налаштування змінних середовища:**
1. Перейдіть до **"Site settings"**
2. Натисніть **"Environment variables"**
3. Додайте наступні змінні:

```
TELEGRAM_BOT_TOKEN=your_bot_token_here
ADMIN_CHAT_ID=your_chat_id_here
BACKEND_URL=https://defi-exchange-backend.onrender.com
```

### **1.4 Налаштування функцій:**
1. Перейдіть до **"Functions"**
2. Переконайтеся що функція `bot.js` активна
3. Перевірте логи функції

---

## 🔧 **Крок 2: Налаштування Telegram Webhook**

### **2.1 Встановлення webhook:**
1. Отримайте URL вашого сайту: `https://your-site-name.netlify.app`
2. Встановіть webhook для бота:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-site-name.netlify.app/.netlify/functions/bot"}'
```

### **2.2 Перевірка webhook:**
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

---

## 🔧 **Крок 3: Налаштування Render Backend**

### **3.1 Оновіть Backend Environment Variables:**
Додайте в ваш Backend сервіс на Render:
```
TELEGRAM_BOT_URL=https://your-site-name.netlify.app
```

### **3.2 Оновіть Frontend Environment Variables:**
Додайте в ваш Frontend сервіс на Render:
```
REACT_APP_TELEGRAM_BOT_URL=https://your-site-name.netlify.app
```

---

## 🧪 **Крок 4: Тестування**

### **4.1 Тест бота:**
1. Напишіть вашому боту `/start`
2. Перевірте чи бот відповідає
3. Перевірте логи на Netlify

### **4.2 Тест виводу:**
1. Відкрийте фронтенд
2. Підключіть гаманець
3. Спробуйте створити заявку на вивід
4. Перевірте чи прийшла заявка в Telegram

### **4.3 Тест функцій:**
1. Перейдіть на `https://your-site-name.netlify.app/.netlify/functions/bot`
2. Перевірте чи функція працює
3. Перевірте логи функції

---

## 📊 **Моніторинг**

### **Netlify Dashboard:**
- **Functions:** Переглядайте логи функцій
- **Analytics:** Статистика використання
- **Deploys:** Історія деплоїв

### **Telegram Bot:**
- **@BotFather:** Управління ботом
- **Логи:** Перевірка роботи

---

## 🚨 **Troubleshooting**

### **Проблема: Бот не відповідає**
**Рішення:**
1. Перевірте токен бота
2. Перевірте Chat ID
3. Перевірте webhook URL
4. Перевірте логи функцій

### **Проблема: Заявки не приходять**
**Рішення:**
1. Перевірте BACKEND_URL
2. Перевірте з'єднання між сервісами
3. Перевірте CORS налаштування
4. Перевірте логи функцій

### **Проблема: Помилки деплою**
**Рішення:**
1. Перевірте package.json
2. Перевірте змінні середовища
3. Перевірте логи збірки
4. Перевірте структуру папок

### **Проблема: Функції не працюють**
**Рішення:**
1. Перевірте netlify.toml
2. Перевірте шлях до функцій
3. Перевірте права доступу
4. Перевірте логи функцій

---

## 💰 **Вартість Netlify**

### **Starter Plan (Безкоштовно):**
- 100GB bandwidth на місяць
- 300 build minutes на місяць
- 125,000 function invocations на місяць
- Підходить для бота

### **Pro Plan ($19/місяць):**
- 1TB bandwidth на місяць
- 3,000 build minutes на місяць
- 1,000,000 function invocations на місяць
- Пріоритетна підтримка

---

## 🎯 **Готово!**

Після виконання всіх кроків ваш Telegram Bot буде працювати на Netlify:

- **Bot URL:** `https://your-site-name.netlify.app`
- **Function URL:** `https://your-site-name.netlify.app/.netlify/functions/bot`
- **Frontend:** `https://defi-exchange-frontend.onrender.com`
- **Backend:** `https://defi-exchange-backend.onrender.com`

**Успішного деплою! 🟢**
