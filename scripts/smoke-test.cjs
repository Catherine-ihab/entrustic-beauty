/**
 * Local smoke test for the Vercel handler bundle.
 * Boots the real Nest app against the real database and issues a request.
 *
 * Usage: node scripts/smoke-test.cjs
 * Requires .env.production (or the DATABASE_* env vars) to be present.
 */
const path = require('path');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..');

/**
 * Minimal .env parser — the repo root has no `dotenv` dependency, and this
 * script must stay runnable with plain `node`.
 */
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

function makeRes() {
  let resolveDone;
  const done = new Promise((resolve) => {
    resolveDone = resolve;
  });

  const res = {
    statusCode: 200,
    body: '',
    headers: {},
    finished: false,
    _done: done,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = JSON.stringify(payload);
      this.finished = true;
      resolveDone();
      return this;
    },
    send(payload) {
      this.body = typeof payload === 'string' ? payload : JSON.stringify(payload);
      this.finished = true;
      resolveDone();
      return this;
    },
    setHeader(k, v) {
      this.headers[k] = v;
    },
    getHeader(k) {
      return this.headers[k];
    },
    removeHeader() {},
    set() {
      return this;
    },
    type() {
      return this;
    },
    end(payload) {
      if (payload) this.body = String(payload);
      this.finished = true;
      resolveDone();
      return this;
    },
    sendStatus(code) {
      this.statusCode = code;
      this.finished = true;
      resolveDone();
      return this;
    },
    write() {},
    // Express calls this to report an error it handed to the error middleware.
    on() {
      return this;
    },
  };
  return res;
}

function makeReq(method, url, body) {
  const headers = { host: 'entrustic-beauty.vercel.app' };
  const req = {
    method,
    url,
    originalUrl: url,
    path: url.split('?')[0],
    headers,
    body,
    query: {},
    get(name) {
      return this.headers[name.toLowerCase()];
    },
    header(name) {
      return this.headers[name.toLowerCase()];
    },
  };
  return req;
}

async function call(req) {
  const res = makeRes();
  await handler(req, res);
  // Give the response a moment to be flushed by the Express layer.
  await Promise.race([
    res._done,
    new Promise((resolve) => setTimeout(resolve, 500)),
  ]);
  return res;
}

(async () => {
  console.log('\n── GET /api/v1/health ──');
  let res = await call(makeReq('GET', '/api/v1/health'));
  console.log('status:', res.statusCode, '| body:', res.body);

  console.log('\n── GET /api/v1/clinics/public-config/demo (tenant resolution) ──');
  res = await call(makeReq('GET', '/api/v1/clinics/public-config/demo'));
  console.log('status:', res.statusCode, '| body:', res.body.slice(0, 400));

  console.log('\n── POST /api/v1/auth/login (seeded owner) ──');
  res = await call(
    makeReq('POST', '/api/v1/auth/login', {
      email: 'owner@demo.yourplatform.com',
      password: 'Demo#Owner2026!',
    }),
  );
  console.log('status:', res.statusCode, '| body:', res.body.slice(0, 300));

  process.exit(0);
})().catch((err) => {
  console.error('SMOKE TEST FAILED:', err);
  process.exit(1);
});
