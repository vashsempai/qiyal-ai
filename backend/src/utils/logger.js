import winston from 'winston';

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, errors } = format;

// Define the custom format for log messages
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'http', // Set level to 'http' to capture request logs
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // Log stack traces
    logFormat
  ),
  transports: [
    // In production, we'll write logs to files
    // In development, we'll log to the console
  ],
});

// If we're not in production, log to the console with colors
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      logFormat
    ),
  }));
} else {
  // In production, write logs to files
  logger.add(new transports.File({ filename: 'logs/error.log', level: 'error' }));
  logger.add(new transports.File({ filename: 'logs/combined.log' }));
}

export default logger;