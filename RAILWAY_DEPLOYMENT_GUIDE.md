# 🚂 Railway Deployment Guide for Telegram Bot

## 📋 **Що потрібно:**

### **1. Railway Account**
- Зареєструйтеся на [railway.app](https://railway.app)
- Підключіть GitHub репозиторій

### **2. Telegram Bot (якщо ще не створений)**
- Створіть бота через @BotFather
- Отримайте токен бота
- Додайте бота в групу/канал
- Отримайте Chat ID

---

## 🚀 **Крок 1: Деплой на Railway**

### **1.1 Створення проекту:**
1. Перейдіть на [railway.app](https://railway.app)
2. Натисніть **"New Project"**
3. Виберіть **"Deploy from GitHub repo"**
4. Виберіть ваш репозиторій `defi-exchange`

### **1.2 Налаштування сервісу:**
1. Railway автоматично виявить `telegram-bot` папку
2. Натисніть **"Deploy"**
3. Зачекайте завершення збірки

### **1.3 Налаштування змінних середовища:**
1. Перейдіть до вашого проекту
2. Натисніть на **"Variables"**
3. Додайте наступні змінні:

```
TELEGRAM_BOT_TOKEN=your_bot_token_here
ADMIN_CHAT_ID=your_chat_id_here
BACKEND_URL=https://defi-exchange-backend.onrender.com
```

### **1.4 Перезапуск сервісу:**
1. Після додавання змінних натисніть **"Redeploy"**
2. Зачекайте завершення деплою

---

## 🔧 **Крок 2: Налаштування Render Backend**

### **2.1 Оновіть Backend Environment Variables:**
Додайте в ваш Backend сервіс на Render:
```
TELEGRAM_BOT_URL=https://your-railway-app.railway.app
```

### **2.2 Оновіть Frontend Environment Variables:**
Додайте в ваш Frontend сервіс на Render:
```
REACT_APP_TELEGRAM_BOT_URL=https://your-railway-app.railway.app
```

---

## 🧪 **Крок 3: Тестування**

### **3.1 Тест бота:**
1. Напишіть вашому боту `/start`
2. Перевірте чи бот відповідає
3. Перевірте логи на Railway

### **3.2 Тест виводу:**
1. Відкрийте фронтенд
2. Підключіть гаманець
3. Спробуйте створити заявку на вивід
4. Перевірте чи прийшла заявка в Telegram

---

## 📊 **Моніторинг**

### **Railway Dashboard:**
- **Logs:** Переглядайте логи бота
- **Metrics:** CPU, Memory, Network
- **Deployments:** Історія деплоїв

### **Telegram Bot:**
- **@BotFather:** Управління ботом
- **Логи:** Перевірка роботи

---

## 🚨 **Troubleshooting**

### **Проблема: Бот не відповідає**
**Рішення:**
1. Перевірте токен бота
2. Перевірте Chat ID
3. Перевірте логи на Railway

### **Проблема: Заявки не приходять**
**Рішення:**
1. Перевірте BACKEND_URL
2. Перевірте з'єднання між сервісами
3. Перевірте CORS налаштування

### **Проблема: Помилки деплою**
**Рішення:**
1. Перевірте package.json
2. Перевірте змінні середовища
3. Перевірте логи збірки

---

## 💰 **Вартість Railway**

### **Hobby Plan (Безкоштовно):**
- 500 годин на місяць
- $5 кредитів на місяць
- Підходить для бота

### **Pro Plan ($5/місяць):**
- Необмежено годин
- Більше ресурсів
- Пріоритетна підтримка

---

## 🎯 **Готово!**

Після виконання всіх кроків ваш Telegram Bot буде працювати на Railway:

- **Bot URL:** `https://your-railway-app.railway.app`
- **Frontend:** `https://defi-exchange-frontend.onrender.com`
- **Backend:** `https://defi-exchange-backend.onrender.com`

**Успішного деплою! 🚂**
