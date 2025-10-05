/**
 * A simple placeholder for a logger utility.
 * In a real production app, this would be replaced with a robust library like Winston.
 */
export const logger = {
  info: (message) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
  },
  warn: (message) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
  },
  error: (message, meta) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
    if (meta) {
      console.error(meta);
    }
  },
};

export default logger;