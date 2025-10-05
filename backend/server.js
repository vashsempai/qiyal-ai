import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mainRouter from './src/routes/index.js';
import errorHandler from './src/middleware/errorHandler.js';
import logger from './src/utils/logger.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware setup
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
  }));
}

// Routes
app.use('/api', mainRouter);

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

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// The server is started in index.js, not here.
// This allows the app to be imported for testing without starting the server.

export { app, server, PORT };