import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configure dotenv to load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { Pool } = pg;

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * Applies all .sql migrations from the current directory.
 */
async function applyMigrations() {
  console.log('Starting database migrations...');
  const client = await pool.connect();
  try {
    // Get all SQL files from the migrations directory
    const migrationFiles = fs
      .readdirSync(__dirname)
      .filter((file) => file.endsWith('.sql'))
      .sort(); // Sort files to ensure sequential execution (001, 002, etc.)

    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
      return;
    }

    console.log(`Found ${migrationFiles.length} migration files.`);

    // Begin a transaction
    await client.query('BEGIN');

    for (const file of migrationFiles) {
      console.log(`Applying migration: ${file}`);
      const filePath = path.join(__dirname, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Split the file content by semicolon to execute statements one by one
      // This is a simple approach; more complex files might need a more robust parser
      const statements = sql.split(';').filter(s => s.trim() !== '');
      for (const statement of statements) {
        await client.query(statement);
      }
      console.log(`Successfully applied migration: ${file}`);
    }

    // Commit the transaction
    await client.query('COMMIT');
    console.log('All migrations applied successfully!');
  } catch (error) {
    // Rollback the transaction in case of an error
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1); // Exit with error code
  } finally {
    // Release the client and end the pool
    client.release();
    await pool.end();
    console.log('Migration process finished.');
  }
}

// Run the migration function
applyMigrations();