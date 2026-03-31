/**
 * FlowCast local setup checker.
 * Run: node scripts/setup.js
 */

require('dotenv').config({ path: './apps/api/.env' });
const { Pool } = require('pg');

const checks = [];

function check(name, value, hint) {
  const ok = !!value;
  checks.push({ name, ok, hint });
}

async function run() {
  console.log('\n🔍 FlowCast Setup Check\n' + '─'.repeat(40));

  // Env vars
  check('DATABASE_URL',        process.env.DATABASE_URL,        'Set in apps/api/.env');
  check('JWT_SECRET',          process.env.JWT_SECRET,          'Run: openssl rand -base64 64');
  check('ANTHROPIC_API_KEY',   process.env.ANTHROPIC_API_KEY,   'Get from console.anthropic.com');
  check('ELEVENLABS_API_KEY',  process.env.ELEVENLABS_API_KEY,  'Get from elevenlabs.io');
  check('PEXELS_API_KEY',      process.env.PEXELS_API_KEY,      'Get from pexels.com/api');

  // Optional
  check('YOUTUBE_CLIENT_ID',   process.env.YOUTUBE_CLIENT_ID,   '(Optional for now)');
  check('META_ACCESS_TOKEN',   process.env.META_ACCESS_TOKEN,   '(Optional for now)');
  check('TIKTOK_ACCESS_TOKEN', process.env.TIKTOK_ACCESS_TOKEN, '(Optional for now)');

  // DB connection test
  process.stdout.write('PostgreSQL connection ... ');
  if (process.env.DATABASE_URL) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000 });
      await pool.query('SELECT 1');
      await pool.end();
      console.log('✅ Connected');
    } catch (err) {
      console.log('❌ Failed —', err.message);
      console.log('   Make sure Docker is running: docker compose up -d postgres');
    }
  } else {
    console.log('⏭  Skipped (DATABASE_URL not set)');
  }

  // Print summary
  console.log('\n' + '─'.repeat(40));
  checks.forEach(({ name, ok, hint }) => {
    console.log(`${ok ? '✅' : '❌'} ${name.padEnd(25)} ${ok ? '' : '← ' + hint}`);
  });

  const missing = checks.filter(c => !c.ok).length;
  console.log('─'.repeat(40));
  if (missing === 0) {
    console.log('\n🚀 All checks passed! Run: npm run dev\n');
  } else {
    console.log(`\n⚠️  ${missing} item(s) missing. Fill in apps/api/.env and retry.\n`);
  }
}

run();
