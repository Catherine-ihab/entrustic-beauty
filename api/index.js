/**
 * Vercel Serverless Function — Entrustic Dental API
 * ─────────────────────────────────────────────────────────────────────────────
 * Vercel's routing sends /api/v1/* here (see vercel.json). The Nest application
 * is booted once per cold start and kept warm across invocations, then every
 * request is handed straight to its Express instance.
 *
 * This keeps the API on the very same origin as the compiled React app, so the
 * browser never needs CORS and the tenant slug is derived from the hostname
 * (entrustic-dental.vercel.app → "entrustic-dental") exactly like it is in the
 * Docker deployment.
 */

// Vercel's tracer (nft) only follows literal require() calls, so these two have
// to be named here:
//   • TypeORM loads the Postgres driver at RUNTIME with require('pg'),
//   • argon2 is a native binding that would otherwise be dropped from the bundle.
// They are reached through the workspace layout (pnpm) that apps/api uses.
try {
  require('../apps/api/node_modules/pg');
} catch (err) {
  // Unresolvable at runtime is not fatal: the tracer already copied the path.
}
try {
  require('../apps/api/node_modules/argon2');
} catch (err) {
  // Same as above — password hashing still works from apps/api's own copy.
}

let handlerPromise = null;

function getHandler() {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      // Built by the build command (`pnpm --filter @clinic/api build`).
      const { createApp } = require('../apps/api/dist/main.js');
      const app = await createApp();
      // Nest only mounts the controller router (and every global interceptor /
      // guard) during init(); `listen()` normally calls it but a serverless
      // function must not open a port. Without this, requests reach Express and
      // fall through to its own 404 handler ("Cannot POST /api/v1/...").
      await app.init();
      // Express instance Nest created internally: a plain `(req, res)` listener.
      return app.getHttpAdapter().getInstance();
    })().catch((err) => {
      // Do not cache a failed boot — let the next invocation retry.
      handlerPromise = null;
      throw err;
    });
  }
  return handlerPromise;
}

module.exports = async (req, res) => {
  const expressApp = await getHandler();
  return expressApp(req, res);
};
