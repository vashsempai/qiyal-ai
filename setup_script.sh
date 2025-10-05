#!/bin/bash

# Qiyal.ai Setup Script
echo "🚀 Настройка Qiyal.ai..."

# Создание структуры
mkdir -p qiyal-ai-fullstack/{backend/{src/{routes,utils},migrations},frontend,nginx}
cd qiyal-ai-fullstack

echo "✅ Структура папок создана"

# Создание docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: qiyal_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build: ./backend
    environment:
      PORT: 5000
      DB_HOST: postgres
      DB_NAME: qiyal_db
      DB_USER: postgres
      DB_PASSWORD: postgres
      JWT_SECRET: super-secret-jwt-key-32-chars-minimum
      CORS_ORIGIN: http://localhost
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
EOF

echo "✅ Docker Compose создан"

# Инструкция
cat > INSTRUCTIONS.md << 'EOF'
# Следующие шаги:

1. Скачайте файлы из чата по ID:
   [67] → backend/package.json
   [68] → backend/server.js
   [128] → backend/.env.example
   [129] → backend/Dockerfile
   [130] → backend/migrations/001_schema.sql
   [131] → backend/src/routes/social.js
   [132] → backend/src/utils/database.js
   [135] → frontend/package.json
   [136] → frontend/vite.config.js
   [134] → frontend/Dockerfile

2. Добавьте frontend файлы:
   - index.html (из последнего демо)
   - style.css (адаптивная версия)
   - app.js (с социальной сетью)

3. Запустите:
   docker-compose up -d

4. Откройте:
   http://localhost
EOF

echo "📋 Файл INSTRUCTIONS.md создан"
echo "🎉 Структура готова! Добавьте файлы согласно инструкции и запустите docker-compose up -d"
