#!/usr/bin/env node

/**
 * FlowCast setup checker.
 * Run: node scripts/setup.js
 *
 * Verifies environment variables and external service connections.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../apps/api/.env') });
const { execSync } = require('child_process');

// Resolve packages from apps/api/node_modules so this script works when run
// from the project root where those packages are not installed.
const API_MODULES = require('path').join(__dirname, '../apps/api/node_modules');
const Module = require('module');
const _resolveFilename = Module._resolveFilename.bind(Module);
Module._resolveFilename = (request, parent, isMain, options) => {
  if (request === '@supabase/supabase-js' || request === '@anthropic-ai/sdk') {
    return _resolveFilename(request, { ...parent, filename: require('path').join(API_MODULES, 'x.js') }, isMain, options);
  }
  return _resolveFilename(request, parent, isMain, options);
};

const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

function ok(label)   { console.log(`  ${GREEN}✓${RESET}  ${label}`); }
function fail(label) { console.log(`  ${RED}✗${RESET}  ${label}`); }
function warn(label) { console.log(`  ${YELLOW}!${RESET}  ${label}`); }

const REQUIRED_API_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'ANTHROPIC_API_KEY',
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_VOICE_ID',
  'PEXELS_API_KEY',
];

const OPTIONAL_API_VARS = [
  'YOUTUBE_CLIENT_ID',
  'YOUTUBE_CLIENT_SECRET',
  'YOUTUBE_REDIRECT_URI',
  'META_ACCESS_TOKEN',
  'TIKTOK_ACCESS_TOKEN',
];

async function main() {
  console.log(`\n${BOLD}FlowCast Setup Checker${RESET}\n`);
  let failed = 0;

  // ─── 1. Check required env vars ───────────────────────────────────────────
  console.log(`${BOLD}Required Environment Variables${RESET}`);
  for (const key of REQUIRED_API_VARS) {
    if (process.env[key]) {
      ok(key);
    } else {
      fail(`${key} — MISSING`);
      failed++;
    }
  }

  console.log(`\n${BOLD}Optional (Publishing) Variables${RESET}`);
  for (const key of OPTIONAL_API_VARS) {
    if (process.env[key]) {
      ok(key);
    } else {
      warn(`${key} — not set (publishing to this platform will be disabled)`);
    }
  }

  // ─── 2. Check FFmpeg ───────────────────────────────────────────────────────
  console.log(`\n${BOLD}System Dependencies${RESET}`);
  try {
    const ffmpegVersion = execSync('ffmpeg -version 2>&1', { stdio: 'pipe' }).toString().split('\n')[0];
    ok(`FFmpeg: ${ffmpegVersion.split('version')[1]?.trim().split(' ')[0] || 'found'}`);
  } catch {
    fail('FFmpeg — NOT FOUND. Install with: brew install ffmpeg (macOS) or apt install ffmpeg (Ubuntu)');
    failed++;
  }

  try {
    execSync('node --version', { stdio: 'pipe' });
    const nodeVer = process.version;
    const major = parseInt(nodeVer.slice(1));
    if (major >= 18) {
      ok(`Node.js: ${nodeVer}`);
    } else {
      fail(`Node.js ${nodeVer} — requires v18 or higher`);
      failed++;
    }
  } catch {
    fail('Node.js version check failed');
    failed++;
  }

  // ─── 3. Test Supabase connection ───────────────────────────────────────────
  console.log(`\n${BOLD}Service Connections${RESET}`);
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
      const { error } = await sb.from('channels').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        fail(`Supabase — ${error.message}`);
        failed++;
      } else {
        ok('Supabase — connected');
      }
    } catch (err) {
      fail(`Supabase — ${err.message}`);
      failed++;
    }
  } else {
    warn('Supabase — skipped (missing credentials)');
  }

  // ─── 4. Test Anthropic API ─────────────────────────────────────────────────
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'ping' }],
      });
      ok('Anthropic Claude API — connected');
    } catch (err) {
      fail(`Anthropic Claude API — ${err.message}`);
      failed++;
    }
  } else {
    warn('Anthropic Claude API — skipped (missing key)');
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50));
  if (failed === 0) {
    console.log(`${GREEN}${BOLD}✓ All checks passed — ready to run: npm run dev${RESET}\n`);
  } else {
    console.log(`${RED}${BOLD}✗ ${failed} check(s) failed — fix the issues above before starting${RESET}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`\nSetup script error: ${err.message}`);
  process.exit(1);
});
