# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN npm install -g pnpm@12 turbo

# ─── Dependencies ────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
# Copy workspace manifests only (layer-cached until these change)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --ignore-scripts

# ─── Build shared-types ──────────────────────────────────────────────────────
FROM deps AS build-shared
WORKDIR /app
COPY packages/shared-types ./packages/shared-types
RUN pnpm --filter @clinic/shared-types build

# ─── Build API ───────────────────────────────────────────────────────────────
FROM build-shared AS build-api
WORKDIR /app
COPY apps/api ./apps/api
# Approve native build for argon2
RUN pnpm approve-builds --all 2>/dev/null || true
RUN pnpm --filter @clinic/api build

# ─── Production image ────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/
RUN npm install -g pnpm@12 && \
    pnpm install --frozen-lockfile --prod --ignore-scripts && \
    pnpm approve-builds --all 2>/dev/null || true

# Copy compiled output
COPY --from=build-api /app/apps/api/dist ./apps/api/dist
COPY --from=build-shared /app/packages/shared-types/dist ./packages/shared-types/dist

WORKDIR /app/apps/api
EXPOSE 3001

# Graceful shutdown support
STOPSIGNAL SIGTERM
CMD ["node", "dist/main"]
