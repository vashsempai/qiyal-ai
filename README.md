# Qiyal.ai 🚀

Qiyal.ai — это современная платформа для фрилансеров и заказчиков, созданная для максимальной эффективности и удобства. В основе платформы лежит интеллектуальная система (AI Matchmaking Core), которая автоматически подбирает наиболее подходящих исполнителей для проектов и самые релевантные заказы для фрилансеров.

Этот проект является полнофункциональным MVP (Minimum Viable Product), демонстрирующим ключевые возможности системы.

## 🏛️ Архитектура

Платформа построена на современном технологическом стеке с четким разделением на Frontend и Backend.

• Frontend: Next.js 14, TypeScript, Tailwind CSS, Apollo Client
• Backend: Node.js, GraphQL (Apollo Server), TypeScript, Prisma
• База данных: PostgreSQL (основная) + Pinecone (векторная для AI)
• AI & ML: OpenAI API для Embeddings
• Инфраструктура (локальная): Docker & Docker Compose

## 📁 Структура проекта

• /backend: Серверная часть приложения.
• /frontend: Клиентская часть приложения.
• /docs: Дополнительная документация.
• docker-compose.yml: Файл для запуска всего стека локально.
• README.md: Этот файл.

## 🚀 Быстрый старт (локальный запуск)

### 1. Предварительные требования

• [Docker](https://www.docker.com/get-started) и Docker Compose.
• Git.

### 2. Клонирование и настройка

```bash
# Клонируйте репозиторий, который вы создали на GitHub
git clone https://github.com/YourUsername/qiyal-ai.git
cd qiyal-ai
```

Создайте файлы .env из примеров и заполните их:

Backend:
```bash
cp backend/.env.example backend/.env
```

В backend/.env вставьте ваши API-ключи от OpenAI и Pinecone.

Frontend:
```bash
cp frontend/.env.local.example frontend/.env.local
```

### 3. Запуск проекта

В корневой папке проекта выполните:

```bash
docker-compose up --build
```

После успешного запуска:
• Frontend будет доступен: http://localhost:3000
• Backend GraphQL Playground: http://localhost:4000

### 4. Остановка проекта

В терминале, где запущен проект, нажмите Ctrl + C, а затем выполните:

```bash
docker-compose down
```

## 📚 Документация

• [API Документация](./docs/API.md)
• [Инструкции по развертыванию](./docs/DEPLOYMENT.md)

---

**Автор:** Kakharman Imenov
