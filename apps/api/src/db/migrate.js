/**
 * Simple migration runner.
 * Runs all .sql files in /migrations in order.
 * Safe to run multiple times — uses IF NOT EXISTS and ON CONFLICT.
 *
 * Usage: node src/db/migrate.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration file(s)`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Running: ${file}`);
    try {
      await pool.query(sql);
      console.log(`  ✅ ${file} complete`);
    } catch (err) {
      console.error(`  ❌ ${file} failed:`, err.message);
      process.exit(1);
    }
  }

  await pool.end();
  console.log('\n✅ All migrations complete.');
}

migrate();
