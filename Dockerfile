# syntax=docker/dockerfile:1
#
# ─────────────────────────────────────────────────────────────────────────────
#  Beauty & Aesthetic Clinic — single-container production image
#
#  One origin serves BOTH the NestJS API (/api/v1/*) and the compiled React SPA,
#  which removes cross-origin problems entirely and gives the deployment a single
#  public URL (e.g. https://beauty-clinic.onrender.com).
#
#  Base is Debian (glibc) on purpose: the `argon2` native addon only ships
#  prebuilt binaries for linux-x64/glibc (no musl build), so Alpine would fail.
#
#  The smallest supported container size (0.25 vCPU / 256 MB on free tiers)
#  is the target: the runtime image keeps only production dependencies and V8's
#  old-space is capped so Node garbage-collects instead of being OOM-killed.
# ─────────────────────────────────────────────────────────────────────────────

FROM node:24-bookworm-slim AS base
RUN npm install -g pnpm@12.9.1
WORKDIR /app

# ── Dependencies (layer-cached until a manifest changes) ─────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

# ── Build shared types, API and web app ──────────────────────────────────────
FROM deps AS build
COPY packages/shared-types ./packages/shared-types
COPY apps/api ./apps/api
COPY apps/web ./apps/web
# Same-origin: the SPA talks to /api/v1 on whatever host serves it.
ENV VITE_API_URL=/api/v1
RUN pnpm --filter @clinic/shared-types build \
 && pnpm --filter @clinic/api build \
 && pnpm --filter @clinic/web build

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production
# Stay comfortably inside the smallest (256 MB) container size.
ENV NODE_OPTIONS=--max-old-space-size=192
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/shared-types/dist ./packages/shared-types/dist
# Vite output is served by the API from apps/api/public
COPY --from=build /app/apps/web/dist ./apps/api/public

WORKDIR /app/apps/api
ENV PORT=3001
EXPOSE 3001
CMD ["node", "dist/main"]
