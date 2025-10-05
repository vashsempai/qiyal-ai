import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { Pool } = pg;

// Check if DATABASE_URL is provided
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

// Create a new connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Use SSL in production environments
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Log when a client is connected
pool.on('connect', () => {
  console.log('Database client connected');
});

// Log any errors on idle clients
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

/**
 * A utility object for database interactions.
 * It exports a query function to execute queries using the connection pool.
 */
export const db = {
  /**
   * Executes a SQL query against the database.
   * @param {string} text - The SQL query string.
   * @param {Array<any>} [params] - The parameters to pass to the query.
   * @returns {Promise<QueryResult<any>>} The result of the query.
   */
  query: (text, params) => pool.query(text, params),

  /**
   * Closes the database connection pool.
   */
  close: () => pool.end(),
};

export default db;