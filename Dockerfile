# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install -g nodemon  # Установка nodemon

COPY . .
EXPOSE 3000

# За замовчуванням запускаємо nodemon у локальному середовищі, але для Swarm налаштуємо окремо в docker-compose.yml
CMD ["node", "src/index.js"]
