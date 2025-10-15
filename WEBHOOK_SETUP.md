# Налаштування Webhook для Telegram бота

## Крок 1: Задеплоїти бота на Render

1. Відкрийте [Render Dashboard](https://dashboard.render.com)
2. Створіть Blueprint з репозиторію `TracerStudio/defi-exchange`
3. Встановіть змінну середовища `TELEGRAM_BOT_TOKEN` для бота
4. Дочекайтеся завершення деплою

## Крок 2: Встановити Webhook

### Варіант 1: Автоматичний (рекомендований)

```bash
cd telegram-bot
npm run setup-webhook
```

### Варіант 2: Ручний через curl

```bash
curl -X POST "https://api.telegram.org/bot7769270215:AAH_R-Q14oxkKHU0a53xK4_evXWiQJBiO54/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://defi-exchange-bot.onrender.com/webhook/7769270215:AAH_R-Q14oxkKHU0a53xK4_evXWiQJBiO54"}'
```

### Варіант 3: Через браузер

Відкрийте в браузері:
```
https://api.telegram.org/bot7769270215:AAH_R-Q14oxkKHU0a53xK4_evXWiQJBiO54/setWebhook?url=https://defi-exchange-bot.onrender.com/webhook/7769270215:AAH_R-Q14oxkKHU0a53xK4_evXWiQJBiO54
```

## Крок 3: Перевірити Webhook

### Перевірити статус webhook:
```bash
curl "https://api.telegram.org/bot7769270215:AAH_R-Q14oxkKHU0a53xK4_evXWiQJBiO54/getWebhookInfo"
```

### Перевірити health check бота:
```
https://defi-exchange-bot.onrender.com/health
```

## Крок 4: Тестування

1. Відкрийте вашого бота в Telegram: [@Get_Client_bot](https://t.me/Get_Client_bot)
2. Надішліть команду `/start`
3. Перевірте логи в Render Dashboard

## Важливі зауваження

1. **URL бота може змінитися** - перевірте актуальний URL в Render Dashboard
2. **Webhook URL має бути HTTPS** - Render автоматично надає HTTPS
3. **Бот має бути запущений** перед встановленням webhook
4. **Не використовуйте polling і webhook одночасно**

## Усунення проблем

### Якщо webhook не працює:

1. **Перевірте URL бота:**
   ```bash
   curl "https://defi-exchange-bot.onrender.com/health"
   ```

2. **Перевірте webhook info:**
   ```bash
   curl "https://api.telegram.org/bot7769270215:AAH_R-Q14oxkKHU0a53xK4_evXWiQJBiO54/getWebhookInfo"
   ```

3. **Видаліть webhook і встановіть знову:**
   ```bash
   curl -X POST "https://api.telegram.org/bot7769270215:AAH_R-Q14oxkKHU0a53xK4_evXWiQJBiO54/deleteWebhook"
   ```

4. **Перевірте логи в Render Dashboard**

## Структура Webhook URL

```
https://defi-exchange-bot.onrender.com/webhook/7769270215:AAH_R-Q14oxkKHU0a53xK4_evXWiQJBiO54
```

Де:
- `https://defi-exchange-bot.onrender.com` - URL вашого бота на Render
- `/webhook/` - endpoint для webhook
- `7769270215:AAH_R-Q14oxkKHU0a53xK4_evXWiQJBiO54` - токен вашого бота
