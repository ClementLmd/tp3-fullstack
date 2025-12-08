import { query } from './connection';
import fs from 'fs';
import path from 'path';

const migrationsDir = path.join(__dirname, '../migrations');

async function runMigrations() {
  try {
    // Create migrations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get already executed migrations
    const executedMigrations = await query('SELECT name FROM migrations ORDER BY id');
    const executedNames = executedMigrations.rows.map((row: any) => row.name);

    // Read migration files
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files`);

    for (const file of files) {
      if (executedNames.includes(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`🔄 Running migration: ${file}`);
      const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      // Run migration in a transaction
      const { getClient } = await import('./connection');
      const client = await getClient();
      try {
        await client.query('BEGIN');
        await client.query(migrationSQL);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ Migration ${file} executed successfully`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Migration ${file} failed:`, error);
        throw error;
      } finally {
        client.release();
      }
    }

    console.log('✅ All migrations completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigrations();

