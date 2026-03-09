import { query } from '../config/database.js';
import { SCHEMA_SQL } from './schema.js';

export async function runMigrations() {
  try {
    console.log('Running database migrations...');

    // Split the SQL into individual statements
    const statements = SCHEMA_SQL.split(';').filter((stmt) => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await query(statement);
      }
    }

    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

export async function initializeDatabase() {
  await runMigrations();
}
