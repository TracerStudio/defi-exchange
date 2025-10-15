# Multi-stage build for DeFi Exchange

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/src
COPY src/package*.json ./
RUN npm install
COPY src/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install --production

# Stage 3: Build Bot
FROM node:18-alpine AS bot-builder
WORKDIR /app/telegram-bot
COPY telegram-bot/package*.json ./
RUN npm install --production

# Stage 4: Final image
FROM node:18-alpine
WORKDIR /app

# Copy built frontend
COPY --from=frontend-builder /app/src/build ./public

# Copy backend
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package*.json ./
COPY admin-server.js ./
COPY contracts/ ./contracts/
COPY database/ ./database/

# Copy bot
COPY --from=bot-builder /app/telegram-bot/node_modules ./telegram-bot/node_modules
COPY --from=bot-builder /app/telegram-bot/package*.json ./telegram-bot/
COPY telegram-bot/ ./telegram-bot/

# Create database directory
RUN mkdir -p database

# Expose port
EXPOSE 3002

# Start command
CMD ["node", "admin-server.js"]
