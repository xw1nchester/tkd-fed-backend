FROM node:22-alpine

# Рабочая директория
WORKDIR /app

# Устанавливаем зависимости
COPY package*.json ./

RUN npm install

# Копируем исходники
COPY . .

# Генерируем Prisma Client
RUN npx prisma generate

# Собираем NestJS
RUN npm run build

# Порт приложения
EXPOSE 8080

# Запуск миграций (опционально) и приложения
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]