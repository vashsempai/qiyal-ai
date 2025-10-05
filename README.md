# 🚀 Qiyal.ai - Полная сборка

Полная документация и файлы для запуска платформы Qiyal.ai с frontend, backend и социальной сетью.

## 📁 Структура проекта

```
qiyal-ai-fullstack/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── utils/
│   ├── migrations/
│   ├── uploads/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

## 🗄️ База данных PostgreSQL

### Схема базы данных:
- **users** - пользователи (фрилансеры, заказчики)
- **projects** - проекты с заявками
- **applications** - заявки на проекты
- **posts** - блог-посты социальной сети
- **comments** - комментарии к постам
- **likes** - лайки постов
- **follows** - подписки между пользователями
- **conversations** - чаты и диалоги
- **messages** - сообщения в чатах
- **payments** - платежи через Kaspi.kz
- **notifications** - уведомления

## ⚙️ Backend API

### Основные эндпоинты:

**Аутентификация:**
- `POST /api/auth/register` - регистрация
- `POST /api/auth/login` - вход
- `GET /api/auth/profile` - профиль пользователя

**Проекты:**
- `GET /api/projects` - список проектов
- `POST /api/projects` - создание проекта
- `POST /api/projects/:id/apply` - подача заявки

**Социальная сеть:**
- `GET /api/posts` - лента постов
- `POST /api/posts` - создание поста
- `POST /api/posts/:id/like` - лайк поста
- `POST /api/posts/:id/comments` - комментарий

**Чат:**
- `GET /api/conversations` - список диалогов
- `POST /api/messages` - отправка сообщения

## 🎨 Frontend Features

### Основные возможности:
- ✅ Адаптивная вёрстка (mobile-first)
- ✅ Светлая/тёмная тема
- ✅ Переключение ролей (фрилансер/заказчик)
- ✅ AI-ассистент с рекомендациями
- ✅ Real-time чат (Socket.io)
- ✅ Социальная лента с блогами
- ✅ NDA-фильтр для постов
- ✅ Система подписок и лайков
- ✅ Поиск и фильтрация
- ✅ Загрузка файлов
- ✅ Email уведомления

## 🔧 Технологический стек

### Backend:
- **Node.js** + Express.js
- **PostgreSQL** с UUID
- **Socket.io** для real-time
- **JWT** аутентификация
- **Multer** для файлов
- **Nodemailer** для email
- **OpenAI API** для AI
- **Kaspi.kz API** для платежей

### Frontend:
- **Vanilla JavaScript** (SPA)
- **CSS Grid/Flexbox**
- **SVG иконки**
- **localStorage** для офлайн
- **Markdown** редактор
- **Progressive Web App**

### DevOps:
- **Docker** + docker-compose
- **Jest** тестирование
- **PM2** для production
- **Nginx** reverse proxy
- **SSL/HTTPS** через Let's Encrypt

## 🚀 Быстрый запуск

### 1. Локальная разработка:

```bash
# 1. Клонируйте репозиторий
git clone <repo-url>
cd qiyal-ai-fullstack

# 2. Настройте PostgreSQL
createdb qiyal_db
psql -d qiyal_db -f backend/migrations/001_initial_schema.sql

# 3. Backend
cd backend
npm install
cp .env.example .env  # Настройте переменные
npm run dev

# 4. Frontend (новый терминал)
cd ../frontend
npm install
cp .env.example .env
npm run dev

# Откройте http://localhost:5173
```

### 2. Docker запуск:

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

## 🔐 Настройка переменных окружения

### Backend (.env):
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_NAME=qiyal_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-32-char-secret-key
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=sk-your-key

# Email
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-app-password

# Kaspi Payment
KASPI_MERCHANT_ID=your-id
KASPI_SECRET_KEY=your-key
```

### Frontend (.env):
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 📊 Тестирование

```bash
# Backend тесты
cd backend
npm test
npm run test:watch

# Coverage отчёт
npm run test -- --coverage
```

## 🌐 Деплой в production

### AWS EC2 + RDS:
1. Создайте EC2 инстанс Ubuntu 22.04
2. Настройте RDS PostgreSQL
3. Установите Node.js, PM2, Nginx
4. Настройте SSL через Certbot
5. Деплой через GitHub Actions

### DigitalOcean App Platform:
1. Подключите GitHub репозиторий
2. Настройте managed PostgreSQL
3. Добавьте переменные окружения
4. Автоматический деплой при push

### Docker на любом VPS:
1. `docker-compose -f docker-compose.prod.yml up -d`
2. Настройте reverse proxy (Traefik/Nginx)
3. SSL сертификаты

## 🔒 Безопасность

- ✅ Helmet для HTTP headers
- ✅ Rate limiting (100 req/15min)
- ✅ XSS protection
- ✅ SQL injection protection
- ✅ JWT с коротким TTL
- ✅ CORS настроен строго
- ✅ File upload validation
- ✅ NDA content filtering

## 📈 Мониторинг

- **PM2** для процессов
- **Winston** для логирования
- **PostgreSQL** метрики
- **Sentry.io** для ошибок
- **UptimeRobot** для доступности

## 🔧 API документация

Полная OpenAPI спецификация доступна на `/api/docs` в development режиме.

## 📞 Поддержка

- GitHub Issues для багов
- Telegram: @qiyal_support
- Email: support@qiyal.ai

---

**Qiyal.ai** - современная AI-powered платформа для фрилансеров и заказчиков в Казахстане 🇰🇿

Версия: 1.0.0 | Дата: Октябрь 2025