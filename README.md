# Entrustic Beauty — Derma & Aesthetic Clinic Management

A **complete, standalone** copy of the Clinic Management Platform, locked to the
**Dermatology** (`dermatology`) specialty. The folder runs by itself — nothing
outside of it is needed.

## What is inside

| Path | Contents |
|---|---|
| `apps/api` | NestJS 11 + TypeORM + PostgreSQL backend, seeded for Dermatology |
| `apps/web` | React 19 + Ant Design frontend, locked to the Dermatology workspace |
| `packages/shared-types` | Shared DTOs / enums used by API and Web |
| `infra/`, `docker-compose.yml` | Nginx/Postgres setup for production (Docker) |

The specialty lock lives in `apps/web/src/specialties/lock.ts`
(`SPECIALTY_LOCK = ClinicType.DERMATOLOGY`); the seed creates the clinic
`Entrustic Beauty` (slug `demo`, type `dermatology`) with Dermatology branding
(`#ec4899`) and 8 specialty services. Override at seed time with
`SEED_CLINIC_SLUG` / `SEED_CLINIC_NAME` / `SEED_CLINIC_WELCOME`.

## Quick start (development)

Prerequisites: Node.js >= 20, pnpm >= 9, PostgreSQL 16+ (or Docker).

```bash
pnpm install
cp .env.example .env          # set DATABASE_* credentials
pnpm --filter @clinic/api migration:run
pnpm --filter @clinic/api seed
pnpm dev
```

- Web application: http://localhost:3000
- API server: http://localhost:3001/api/v1

## Seeded services

- Dermatology Consultation (30 min — 300 EGP)
- Acne Treatment Session (45 min — 400 EGP)
- Full-Body Mole Mapping (45 min — 500 EGP)
- Chemical Peel (45 min — 500 EGP)
- Microdermabrasion (45 min — 450 EGP)
- Skin Infection Treatment (20 min — 250 EGP)
- Biopsy & Lab Review (30 min — 350 EGP)
- Follow-Up Review (20 min — 150 EGP)

## Credentials (demo seed)

- **Platform super admin**: `admin@yourplatform.com` / `ChangeMe#Admin2026!`
- **Dermatology clinic owner** (slug `demo`): `owner@demo.yourplatform.com` / `Demo#Owner2026!`

*Change all passwords before deploying to a public environment.*

## Running several specialty programs side by side

Each program folder has its own Docker project name and container names
(`clinic_dermatology_*`), so containers never collide. To avoid host-port
collisions, override in `.env`:

```env
DATABASE_PORT=5433   # postgres host port
API_PORT=3011        # API host port (docker)
WEB_HTTP_PORT=8081   # web HTTP host port (docker)
WEB_HTTPS_PORT=8443  # web HTTPS host port (docker)
REDIS_HOST_PORT=6380 # redis host port (docker)
PORT=3011            # API port for `pnpm dev` (dev mode ignores API_PORT)
```

## Production (Docker Compose)

```bash
cp .env.production.example .env   # supply JWT/database/storage secrets
docker compose up -d --build
```

## Regenerating this folder

From the source repository root:

```bash
node scripts/generate-specialty-programs.mjs dermatology
```
