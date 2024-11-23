# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install -g nodemon  # Встановлення nodemon глобально

COPY . .

EXPOSE 3000
