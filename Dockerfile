# Використовуємо Node.js 18 Alpine для меншого розміру
FROM node:18-alpine

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо package.json та package-lock.json
COPY package*.json ./

# Встановлюємо залежності
RUN npm ci --only=production

# Копіюємо весь проект
COPY . .

# Будуємо React додаток
RUN npm run build

# Встановлюємо порт
EXPOSE 3002

# Створюємо скрипт для запуску
RUN echo '#!/bin/sh\n\
# Запускаємо адмін сервер у фоновому режимі\n\
node admin-server.js &\n\
# Чекаємо трохи, щоб сервер запустився\n\
sleep 3\n\
# Запускаємо статичний сервер для React додатку\n\
npx serve -s build -l 3000\n\
' > start.sh && chmod +x start.sh

# Команда запуску
CMD ["./start.sh"]
