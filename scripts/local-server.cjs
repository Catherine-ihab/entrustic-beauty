/**
 * Boots the Vercel handler bundle behind a real HTTP server so the full stack —
 * Express, the CLS middleware, tenant resolution and the Nest router — can be
 * exercised exactly as Vercel would, but locally.
 *
 * Usage: node scripts/local-server.cjs
 */
const http = require('http');
const path = require('path');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..');

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
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(path.join(repoRoot, '.env.production'));

const handler = require(path.join(repoRoot, 'api', '_bundle.cjs'));

const PORT = 4321;
const server = http.createServer((req, res) => {
  handler(req, res).catch((err) => {
    console.error('HANDLER ERROR:', err);
    if (!res.headersSent) res.writeHead(500);
    res.end('handler error');
  });
});

server.listen(PORT, () => {
  console.log(`Local server on http://localhost:${PORT} (host header drives tenant)`);
});
