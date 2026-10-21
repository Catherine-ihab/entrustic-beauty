/**
 * Bundles the compiled Nest API into a single self-contained CommonJS file for
 * the Vercel serverless function.
 *
 * Why this exists
 * ───────────────
 * `nest build` emits a tree of CommonJS files under `apps/api/dist`. Vercel's
 * Node File Trace does not follow the nested `require()` calls in that tree in a
 * pnpm monorepo: it copies `main.js` and `app.module.js` but nothing below them,
 * so every deployment crashed with
 *   Error: Cannot find module './config/env.validation'
 * Neither `functions[].includeFiles` nor the legacy
 * `builds[].config.includeFiles` had any effect with the current builder — the
 * whole `apps/api/dist` tree was absent from the produced function bundle.
 *
 * Why the input is JavaScript, not TypeScript
 * ───────────────────────────────────────────
 * NestJS resolves dependencies from the `design:paramtypes` metadata that
 * `tsc` emits for decorated classes. esbuild does not emit that metadata, so
 * bundling the .ts sources directly produced an app whose JwtStrategy received
 * `undefined` instead of ConfigService. Bundling the already-compiled output
 * keeps the metadata that `nest build` wrote.
 *
 * Native addons (`argon2`) and the driver TypeORM loads at runtime (`pg`) stay
 * external so their prebuilt binaries are used as-is.
 */
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

/** Compiled entry point produced by `pnpm --filter @clinic/api build`. */
const apiEntry = path.join(repoRoot, 'apps', 'api', 'dist', 'api', 'vercel-entry.js');
const outfile = path.join(repoRoot, 'api', '_bundle.cjs');

if (!fs.existsSync(apiEntry)) {
  throw new Error(
    `Compiled API entry not found at ${apiEntry}.\n` +
      `Run \`pnpm --filter @clinic/api build\` (or the whole build command) first.`,
  );
}

await build({
  entryPoints: [apiEntry],
  outfile,
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  sourcemap: true,
  logLevel: 'info',
  absWorkingDir: repoRoot,
  // Loaded at runtime by name rather than inlined:
  //   • pg     — TypeORM resolves it lazily
  //   • argon2 — native binding with prebuilt binaries
  //   • @nestjs/websockets, @nestjs/microservices — optional peers that Nest
  //     probes through try/catch; they are not installed and never loaded here.
  external: [
    'pg',
    'pg-native',
    'argon2',
    '@nestjs/websockets',
    '@nestjs/websockets/socket-module',
    '@nestjs/microservices',
    '@nestjs/microservices/microservices-module',
  ],
  // TypeORM's optional `app-root-path` helper reads `module.parent`, which does
  // not exist once everything is a single file. It is only used by the ORM's
  // CLI/GUI tooling, so a minimal stand-in keeps the bundle self-contained.
  alias: {
    'app-root-path': path.join(__dirname, 'shims', 'app-root-path.cjs'),
  },
});

const stats = fs.statSync(outfile);
console.log(
  `[bundle-api] wrote api/_bundle.cjs (${(stats.size / 1024).toFixed(0)} KB)`,
);
