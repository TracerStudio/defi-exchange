# WalletConnect Fix

## Проблема
```
The origin https://defi-exchange-main.onrender.com is not in your allow list
```

## Рішення

1. **Перейдіть на Reown Dashboard:**
   - Відкрийте https://dashboard.reown.com
   - Увійдіть в свій акаунт

2. **Додайте домен в allow list:**
   - Знайдіть ваш проект
   - Перейдіть в налаштування
   - Додайте домен: `https://defi-exchange-main.onrender.com`

3. **Альтернативно - створіть новий проект:**
   - Створіть новий проект в Reown Dashboard
   - Скопіюйте новий Project ID
   - Оновіть `src/appkit-config.js`

## Тестування

Після виправлення:
1. Перезавантажте сайт
2. Спробуйте підключити гаманець
3. Перевірте чи зникла помилка

## Якщо не допомогло

Створіть новий проект в Reown Dashboard і оновіть конфігурацію.
