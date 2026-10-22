/**
 * Exercises GET /api/v1/dashboard/summary through the bundled Vercel handler,
 * exactly as the smoke test does (host header drives tenant resolution).
 *
 * Usage: node scripts/smoke-dashboard.cjs
 */
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

const HOST = 'entrustic-beauty.vercel.app';

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
    on() {
      return this;
    },
  };
  return res;
}

function makeReq(method, url, body, headers = {}) {
  const h = { host: HOST, ...headers };
  return {
    method,
    url,
    originalUrl: url,
    path: url.split('?')[0],
    headers: h,
    body,
    query: {},
    socket: { remoteAddress: '127.0.0.1' },
    ip: '127.0.0.1',
    get(name) {
      return this.headers[name.toLowerCase()];
    },
    header(name) {
      return this.headers[name.toLowerCase()];
    },
  };
}

async function call(req) {
  const res = makeRes();
  await handler(req, res);
  await Promise.race([
    res._done,
    new Promise((resolve) => setTimeout(resolve, 800)),
  ]);
  // The Express/Nest layer may flush the body after the handler resolves.
  if (!res.body) {
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return res;
}

(async () => {
  // Warm up the Nest app so the first real request is not racing bootstrap.
  await call(makeReq('GET', '/api/v1/health'));

  console.log('\n── POST /api/v1/auth/login ──');
  let res = await call(
    makeReq('POST', '/api/v1/auth/login', {
      email: 'owner@demo.entrusticbeauty.app',
      password: 'Demo#Owner2026!',
    }),
  );
  console.log('status:', res.statusCode, '| raw:', res.body.slice(0, 120));
  const login = JSON.parse(res.body);
  console.log('status:', res.statusCode, '| success:', login.success);
  const token = login?.data?.accessToken;
  if (!token) {
    console.log('body:', res.body.slice(0, 400));
    process.exit(1);
  }

  console.log('\n── GET /api/v1/dashboard/summary ──');
  res = await call(
    makeReq('GET', '/api/v1/dashboard/summary', undefined, {
      authorization: `Bearer ${token}`,
    }),
  );
  console.log('status:', res.statusCode);
  const summary = JSON.parse(res.body)?.data;
  if (!summary) {
    console.log('body:', res.body.slice(0, 800));
    process.exit(1);
  }

  console.log(JSON.stringify(summary, null, 1).slice(0, 2500));
  process.exit(0);
})().catch((err) => {
  console.error('DASHBOARD SMOKE FAILED:', err);
  process.exit(1);
});
