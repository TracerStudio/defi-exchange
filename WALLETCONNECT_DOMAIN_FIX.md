# Виправлення помилки WalletConnect домену

## Проблема
```
The origin https://defi-exchange-main.onrender.com is not in your allow list. 
Please update your allowed domains at https://dashboard.reown.com.
```

## Рішення

### Крок 1: Відкрийте Reown Dashboard
1. Перейдіть на [https://dashboard.reown.com](https://dashboard.reown.com)
2. Увійдіть в свій акаунт
3. Знайдіть проект з ID: `2ac4c10375d31642363f4e551e6d54a7`

### Крок 2: Додайте домен
1. Відкрийте налаштування проекту
2. Знайдіть розділ "Allowed Domains" або "Domain Settings"
3. Додайте домен: `https://defi-exchange-main.onrender.com`
4. Збережіть зміни

### Крок 3: Альтернативне рішення
Якщо не можете знайти налаштування доменів, створіть новий проект:

1. Натисніть "Create New Project"
2. Введіть назву: "DeFi Exchange Production"
3. Скопіюйте новий Project ID
4. Оновіть `src/appkit-config.js`:

```javascript
// Замініть старий Project ID
const projectId = 'YOUR_NEW_PROJECT_ID'; // ← Новий Project ID
```

### Крок 4: Оновіть код
Замініть Project ID в `src/appkit-config.js`:

```javascript
// 1. Get projectId from https://dashboard.reown.com
const projectId = 'YOUR_NEW_PROJECT_ID' // ← ЗАМІНІТЬ НА НОВИЙ!
```

### Крок 5: Перезапустіть додаток
Після оновлення Project ID перезапустіть додаток на Render.

## Перевірка
Після виправлення помилка має зникнути, і WalletConnect має працювати без попереджень.

## Важливо
- Не забудьте оновити Project ID в коді
- Збережіть зміни в Git
- Перезапустіть додаток на Render
