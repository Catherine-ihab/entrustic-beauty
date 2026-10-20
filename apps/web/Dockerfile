# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN npm install -g pnpm@12

# ─── Dependencies ────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

# ─── Build ───────────────────────────────────────────────────────────────────
FROM deps AS build
WORKDIR /app
COPY packages/shared-types ./packages/shared-types
COPY apps/web ./apps/web
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter @clinic/web build

# ─── Nginx Production Serve ──────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production
# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf
# Copy built assets
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
# Nginx config will be mounted via docker-compose volume
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
