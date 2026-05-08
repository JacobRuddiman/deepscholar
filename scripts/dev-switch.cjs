/**
 * Database mode switcher for DeepScholar dev server.
 *
 * Usage:
 *   node scripts/dev-switch.cjs local   — SQLite (file:./dev.db), no internet needed
 *   node scripts/dev-switch.cjs remote  — PostgreSQL from .env DATABASE_URL
 *
 * What it does:
 *   1. Patches prisma/schema.prisma provider in-place (sqlite ↔ postgresql)
 *   2. Runs `prisma generate` (+ `prisma db push` for SQLite on first run)
 *   3. Starts `next dev --turbo` with the right env vars
 *   4. On exit (Ctrl-C), restores the schema provider back to postgresql
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCHEMA = path.join(ROOT, 'prisma', 'schema.prisma');
const LOCAL_DB = path.join(ROOT, 'prisma', 'dev.db');

const mode = process.argv[2] || 'local';
if (!['local', 'remote'].includes(mode)) {
  console.error('Usage: node scripts/dev-switch.cjs <local|remote>');
  process.exit(1);
}

const isLocal = mode === 'local';

// --- helpers ---

function readSchema() {
  return fs.readFileSync(SCHEMA, 'utf-8');
}

function writeSchema(content) {
  fs.writeFileSync(SCHEMA, content, 'utf-8');
}

function setProvider(schema, provider) {
  return schema.replace(
    /provider\s*=\s*"(postgresql|sqlite)"/,
    `provider = "${provider}"`,
  );
}

function currentProvider(schema) {
  const m = schema.match(/provider\s*=\s*"(postgresql|sqlite)"/);
  return m ? m[1] : null;
}

// --- main ---

const original = readSchema();
const originalProvider = currentProvider(original);
const targetProvider = isLocal ? 'sqlite' : 'postgresql';

// Patch schema to target provider (also fixes stale state from a killed process)
if (originalProvider !== targetProvider) {
  console.log(`Switching schema provider: ${originalProvider} -> ${targetProvider}`);
  writeSchema(setProvider(original, targetProvider));
} else {
  console.log(`Schema already set to ${targetProvider}`);
}

// Restore schema to postgresql on shutdown
let restored = false;
function restore() {
  if (restored) return;
  restored = true;
  try {
    const current = readSchema();
    if (currentProvider(current) !== 'postgresql') {
      console.log('\nRestoring schema provider to postgresql');
      writeSchema(setProvider(current, 'postgresql'));
    }
  } catch { /* shutting down, best-effort */ }
}

// Only restore when the child process exits or we get a signal — NOT on
// the parent's 'exit' event, which fires while the child is still running.
process.on('SIGINT', () => { restore(); process.exit(0); });
process.on('SIGTERM', () => { restore(); process.exit(0); });

// Prisma reads DATABASE_URL from .env, which may have the postgres URL.
// Override it explicitly for local mode so all prisma commands see the right value.
const prismaEnv = {
  ...process.env,
  ...(isLocal ? { DATABASE_URL: 'file:./dev.db' } : {}),
};

// Windows DLL lock workaround — remove locked engine and retry
function runPrisma(cmd, label) {
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit', env: prismaEnv });
  } catch {
    const dll = path.join(ROOT, 'node_modules', '.prisma', 'client', 'query_engine-windows.dll.node');
    if (fs.existsSync(dll)) {
      try { fs.unlinkSync(dll); } catch { /* ignore */ }
      execSync(cmd, { cwd: ROOT, stdio: 'inherit', env: prismaEnv });
    } else {
      console.error(`${label} failed`);
      process.exit(1);
    }
  }
}

console.log('Running prisma generate...');
runPrisma('npx prisma generate', 'prisma generate');

// For SQLite, ensure the DB exists and schema is synced
if (isLocal) {
  const dbExists = fs.existsSync(LOCAL_DB);
  console.log(dbExists ? 'Syncing schema to local database...' : 'Creating local SQLite database...');
  runPrisma('npx prisma db push --accept-data-loss', 'prisma db push');
}

// Build env
const env = {
  ...process.env,
  NEXT_PUBLIC_LOCAL_AUTH: 'true',
  NEXT_PUBLIC_LOCAL_MODE: 'true',
  NEXT_PUBLIC_LOCAL_DB: isLocal ? 'true' : 'false',
};

if (isLocal) {
  env.DATABASE_URL = 'file:./dev.db';
}

// Forward extra args (e.g. --port 3001)
const extra = process.argv.slice(3);
const args = ['next', 'dev', '--turbo', ...extra];

console.log(`\nStarting dev server (${mode} mode)...\n`);

const child = spawn('npx', args, {
  cwd: ROOT,
  stdio: 'inherit',
  env,
  shell: true,
});

child.on('exit', (code) => {
  restore();
  process.exit(code ?? 0);
});
