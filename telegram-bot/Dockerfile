# Використовуємо Node.js 18 Alpine для меншого розміру
FROM node:18-alpine

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо package.json та package-lock.json
COPY package*.json ./

# Встановлюємо залежності
RUN npm ci --only=production

# Копіюємо файли бота
COPY . .

# Створюємо директорію для бази даних
RUN mkdir -p /app/data

# Встановлюємо порт (якщо потрібен для веб-хуків)
EXPOSE 3001

# Команда запуску
CMD ["npm", "start"]
