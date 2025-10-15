# Інструкції для деплою на Render

## Структура проекту

Проект складається з двох частин:
1. **Основний додаток** (адмін сервер + фронт) - запускається разом
2. **Telegram бот** - запускається окремо

## Крок 1: Підготовка репозиторію

1. Завантажте код у репозиторій `defi-exchange`
2. Переконайтеся, що всі файли закомічені:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

## Крок 2: Деплой основного додатку

### 2.1 Створення Web Service

1. Увійдіть в [Render Dashboard](https://dashboard.render.com)
2. Натисніть "New +" → "Web Service"
3. Підключіть репозиторій `defi-exchange`
4. Налаштуйте сервіс:

**Основні налаштування:**
- **Name**: `defi-exchange-main`
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node admin-server.js & npx serve -s build -l 3000`
- **Instance Type**: `Starter` (або вищий залежно від потреб)

**Environment Variables:**
```
NODE_ENV=production
PORT=3002
```

**Advanced Settings:**
- **Auto-Deploy**: `Yes`
- **Branch**: `main`

### 2.2 Налаштування портів

Render автоматично визначить порт з змінної середовища `PORT`. Адмін сервер буде доступний на порту 3002, а фронт на порту 3000.

## Крок 3: Деплой Telegram бота

### 3.1 Створення окремого Web Service

1. Натисніть "New +" → "Web Service"
2. Підключіть той самий репозиторій `defi-exchange`
3. Налаштуйте сервіс:

**Основні налаштування:**
- **Name**: `defi-exchange-bot`
- **Environment**: `Node`
- **Root Directory**: `telegram-bot`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: `Starter`

**Environment Variables:**
```
NODE_ENV=production
TELEGRAM_BOT_TOKEN=your_bot_token_here
ADMIN_SERVER_URL=https://your-main-app.onrender.com
```

**Advanced Settings:**
- **Auto-Deploy**: `Yes`
- **Branch**: `main`

## Крок 4: Налаштування змінних середовища

### Для основного додатку:
```
NODE_ENV=production
PORT=3002
```

### Для Telegram бота:
```
NODE_ENV=production
TELEGRAM_BOT_TOKEN=your_actual_bot_token
ADMIN_SERVER_URL=https://defi-exchange-main.onrender.com
```

## Крок 5: Перевірка деплою

1. **Основний додаток**: Відкрийте `https://your-app-name.onrender.com`
2. **Адмін панель**: Відкрийте `https://your-app-name.onrender.com:3002`
3. **Telegram бот**: Перевірте, що бот відповідає на команди

## Крок 6: Налаштування домену (опціонально)

1. У налаштуваннях сервісу перейдіть в "Custom Domains"
2. Додайте ваш домен
3. Налаштуйте DNS записи згідно з інструкціями Render

## Важливі зауваження

1. **База даних**: Файли бази даних будуть зберігатися в ефемерній файловій системі. Для продакшн використання рекомендую підключити зовнішню базу даних.

2. **Змінні середовища**: Не забудьте встановити всі необхідні змінні середовища в налаштуваннях Render.

3. **Моніторинг**: Використовуйте логи Render для відстеження роботи додатків.

4. **Backup**: Налаштуйте регулярне резервне копіювання даних.

## Локальне тестування

Для тестування локально використовуйте:

```bash
# Запуск всього стеку
docker-compose up --build

# Або окремо
npm run docker:build
npm run docker:run
```

## Підтримка

При виникненні проблем перевірте:
1. Логи в Render Dashboard
2. Правильність змінних середовища
3. Доступність зовнішніх API
4. Налаштування мережі та портів
