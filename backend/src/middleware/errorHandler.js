import logger from '../utils/logger.js';

/**
 * A centralized error handling middleware for the Express application.
 * It catches errors passed from other middleware and sends a standardized JSON response.
 *
 * @param {Error} err - The error object.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The next middleware function.
 */
export const errorHandler = (err, req, res, next) => {
  // Log the error for debugging purposes
  logger.error(err.message, { stack: err.stack });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  // Send a structured error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      // Only include the stack trace in development mode for security reasons
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
};

export default errorHandler;