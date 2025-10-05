import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mainRouter from './src/routes/index.js';
import errorHandler from './src/middleware/errorHandler.js';
import logger from './src/utils/logger.js';
import { Server } from 'socket.io';
import { ChatService } from './src/services/chat.service.js';
import * as Sentry from '@sentry/node';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_conversation', async (conversationId) => {
    socket.join(conversationId);
  });

  socket.on('send_message', async (data) => {
    try {
      // Assuming ChatService.sendMessage now takes the sender's socket id
      // to prevent them from receiving their own message event.
      const message = await ChatService.sendMessage(data.senderId, data.conversationId, data);
      io.to(data.conversationId).emit('new_message', message);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.conversationId).emit('user_typing', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Sentry request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

// Middleware setup
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny',
    },
  })
);
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
// Setup morgan to use the Winston logger stream
const stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Skip logging in the test environment
const skip = () => process.env.NODE_ENV === 'test';

// Build the morgan middleware
const morganMiddleware = morgan(
  // Use 'dev' format for development, 'combined' for production
  process.env.NODE_ENV === 'development' ? 'dev' : 'combined',
  { stream, skip }
);

app.use(morganMiddleware);

// Apply the general API rate limiter to all API routes
import { apiRateLimit } from './src/middleware/advancedRateLimit.js';
app.use('/api', apiRateLimit, mainRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Resource not found'
  });
});

// Sentry error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// The server is started in index.js, not here.
// This allows the app to be imported for testing without starting the server.

export { app, server, io, PORT };