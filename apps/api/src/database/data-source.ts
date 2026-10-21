/**
 * TypeORM Data Source — used by CLI migrations and the seed script only.
 * (The running app configures TypeORM in app.module.ts via ConfigModule.)
 *
 * Usage:
 *   pnpm --filter @clinic/api migration:generate -- -n MigrationName
 *   pnpm --filter @clinic/api migration:run
 *   pnpm --filter @clinic/api migration:revert
 *   pnpm --filter @clinic/api seed
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Resolve the monorepo root by walking up until the workspace manifest shows up.
 *
 * A fixed `../../../` is wrong here: at runtime `__dirname` is
 * `<repo>/apps/api/dist/database`, but under ts-node it is
 * `<repo>/apps/api/src/database`. Those differ by one level, so a relative hop
 * silently pointed at `<repo>/apps` and every env file was missed — the CLI then
 * fell back to the hard-coded localhost defaults and wrote to the wrong server.
 */
function findRepoRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    const manifest = path.join(dir, 'pnpm-workspace.yaml');
    if (fs.existsSync(manifest)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

const repoRoot = findRepoRoot(__dirname);

/**
 * Load order matters: `.env` wins over `.env.production` only if listed first,
 * and dotenv never overwrites an already-set variable. Production values must
 * therefore be applied *before* the development defaults.
 */
for (const file of ['.env.production', '.env', '.env.example']) {
  dotenv.config({ path: path.join(repoRoot, file) });
}

/**
 * Managed Postgres (Neon, Render, RDS…) refuses non-TLS connections and Neon
 * additionally requires SNI, so SSL has to be explicit when DATABASE_SSL is on.
 */
const useSsl = (process.env.DATABASE_SSL || '').toLowerCase() === 'true';

const database = process.env.DATABASE_NAME || 'clinic_platform_dev';

/**
 * Fail loudly instead of silently migrating the wrong database. Both failures
 * this guard prevents have already happened once during setup, and each one
 * wrote schema/data into an unrelated clinic's database.
 */
if (useSsl && database === 'neondb') {
  throw new Error(
    `Refusing to run against the shared "neondb" database.\n` +
      `Set DATABASE_NAME to a dedicated database (e.g. entrustic_beauty) — ` +
      `check ${path.join(repoRoot, '.env.production')}.`,
  );
}

/** TypeORM's glob loader ignores brace syntax (`*.{ts,js}`), so list dirs. */
function listFiles(dir: string, match: (name: string) => boolean): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(match)
    .map((name) => path.join(dir, name));
}

/** Recursively collect entity files under `<src|dist>/modules`. */
function collectEntities(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.entity\.(ts|js)$/.test(entry.name)) out.push(full);
    }
  };
  walk(root);
  return out;
}

const isMigration = (name: string) =>
  /\.(ts|js)$/.test(name) && !name.endsWith('.d.ts');

console.log(
  `[data-source] ${process.env.DATABASE_USER}@${
    process.env.DATABASE_HOST || 'localhost'
  }:${process.env.DATABASE_PORT || '5432'}/${database} (ssl=${useSsl})`,
);

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: true,
  entities: collectEntities(path.join(__dirname, '../modules')),
  migrations: listFiles(path.join(__dirname, 'migrations'), isMigration),
  migrationsTableName: 'typeorm_migrations',
});
