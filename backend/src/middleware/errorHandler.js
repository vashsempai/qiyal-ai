const logger = require('../utils/logger'); // We will create this logger utility later

const errorHandler = (err, req, res, next) => {
  console.error(err); // For dev logging

  // In a real app, you'd use a logger like Winston
  // logger.error(err.message, { stack: err.stack });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    // Include stack trace only in development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;