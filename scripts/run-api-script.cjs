/**
 * Runs a TypeScript script from apps/api with .env.production loaded first.
 *
 * The repo has no root `dotenv` dependency and ts-node does not read .env
 * files on its own, so this small harness parses the env file and then
 * delegates to the requested script via ts-node.
 *
 * Usage:
 *   node scripts/run-api-script.cjs src/database/seed-demo.ts
 */
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const apiDir = path.join(repoRoot, 'apps', 'api');

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(path.join(repoRoot, '.env.production'));

const script = process.argv[2];
if (!script) {
  console.error('Usage: node scripts/run-api-script.cjs <script-relative-to-apps/api>');
  process.exit(1);
}

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['ts-node', '-r', 'tsconfig-paths/register', script],
  { cwd: apiDir, stdio: 'inherit', env: process.env, shell: process.platform === 'win32' },
);

process.exit(result.status ?? 1);
