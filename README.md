# Qiyal.ai - AI-Powered Freelance Platform

This repository contains the complete source code for the Qiyal.ai platform, including the backend and frontend applications.

## ⚙️ Technology Stack

### Backend:
- **Node.js** + Express.js
- **PostgreSQL** with UUIDs
- **Socket.io** for real-time features
- **JWT** for authentication
- **Stripe** for payment processing
- **Google Gemini** for AI features
- **Winston** for logging

### Frontend:
- **Vanilla JavaScript** (Single Page Application)
- **Vite** for frontend tooling
- **CSS Grid/Flexbox** for layout

### DevOps:
- **Docker** + docker-compose
- **Jest** for testing
- **Nginx** as a reverse proxy

---

## 🚀 Getting Started

### 1. Local Development (without Docker)

**Prerequisites:**
- Node.js (v18 or later)
- PostgreSQL

**Setup:**
1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd qiyal-ai-fullstack
    ```

2.  **Configure PostgreSQL:**
    - Create a new database (e.g., `qiyal_db`).
    - Run the migrations (see backend setup).

3.  **Setup Backend:**
    ```bash
    cd backend
    npm install
    cp .env.example .env
    # Edit .env with your configuration
    npm run migrate
    npm run dev
    ```

4.  **Setup Frontend (in a new terminal):**
    ```bash
    cd frontend
    npm install
    cp .env.example .env
    npm run dev
    ```

5.  Open your browser to `http://localhost:5173`.

### 2. Docker-Based Setup

1.  **Configure Environment:**
    - Copy `backend/.env.example` to `backend/.env` and fill in the variables.
    - Ensure `DATABASE_URL` in `backend/.env` matches the PostgreSQL service in `docker-compose.yml`.

2.  **Run Docker Compose:**
    ```bash
    docker-compose up -d --build
    ```

3.  **Run Migrations:**
    ```bash
    docker-compose exec backend npm run migrate
    ```
---

## 🔐 Environment Variables

### `backend/.env`
```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:5000

# Database (must match docker-compose.yml if using Docker)
DATABASE_URL=postgresql://qiyal_user:your_password@localhost:5432/qiyal_db

# JWT Authentication
JWT_SECRET=a-very-strong-and-long-secret-key-for-jwt
JWT_REFRESH_SECRET=another-very-strong-secret-for-refresh

# Stripe Payment Gateway
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI Service (Google Gemini)
GEMINI_API_KEY=your-gemini-api-key
```

### `frontend/.env`
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 📊 Testing

1.  **Run All Tests:**
    From the `backend/` directory:
    ```bash
    npm test
    ```

2.  **Testing Stripe Webhooks Locally:**
    Stripe requires a public endpoint for webhooks, so you need a tool to forward requests to your local server.

    - **Install the Stripe CLI:** Follow the instructions on the [official Stripe website](https://stripe.com/docs/stripe-cli).
    - **Log in:**
      ```bash
      stripe login
      ```
    - **Forward webhooks:**
      Run this command to forward events to your local webhook endpoint. The backend must be running.
      ```bash
      stripe listen --forward-to localhost:5000/api/payments/webhook/stripe
      ```
    - The CLI will provide you with a new webhook secret (e.g., `whsec_...`). **Use this secret** in your `backend/.env` file for local testing.

---

## 🔒 Security

- ✅ **Helmet** for securing HTTP headers.
- ✅ **Rate limiting** on sensitive endpoints.
- ✅ **CORS** configured to restrict access.
- ✅ **Stripe webhook signature verification**.
- ✅ **SQL injection** protection via parameterized queries.
- ✅ **XSS protection** through proper frontend handling of data.

## 📖 API Documentation

A full OpenAPI (Swagger) specification can be found in `backend/docs/openapi.yml`. When the backend is running in development mode, interactive documentation is available at `/api/docs`.