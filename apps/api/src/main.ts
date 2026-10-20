import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { existsSync } from 'fs';
import { join } from 'path';
import helmet from 'helmet';

/**
 * Builds and configures the Nest application WITHOUT binding a port.
 *
 * Exported so a serverless adapter (Vercel function in `api/index.js`) can reuse
 * exactly the same bootstrap as the Docker container instead of duplicating the
 * security, CORS and validation wiring.
 */
export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const logger = new Logger('Bootstrap');

  // Running behind a reverse proxy (Render / nginx / Cloudflare) so req.ip and
  // req.secure describe the real client instead of the proxy hop.
  app.set('trust proxy', 1);

  // ─── Request body limits ──────────────────────────────────────────────────
  // Clinic logos and before/after images are uploaded as data URLs, which are
  // larger than the 100 KB Express default. Registered through the platform
  // adapter itself.
  const BODY_LIMIT = '5mb';
  app.useBodyParser('json', { limit: BODY_LIMIT });
  app.useBodyParser('urlencoded', { extended: true, limit: BODY_LIMIT });

  // ─── Security Headers (Helmet) ────────────────────────────────────────────
  // Tightened from the default: explicit CSP, no sniffing, no iframe embedding.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          // Google Fonts stylesheet is loaded from fonts.googleapis.com and the
          // font files themselves from fonts.gstatic.com (covered by fontSrc).
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'https:', 'data:'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false, // disabled: presigned S3 images would break
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      noSniff: true,
      xssFilter: true,
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
    }),
  );

  // ─── CORS ─────────────────────────────────────────────────────────────────
  // In production the platform restricts to its own domain pattern. Extra hosts
  // (e.g. the public *.onrender.com URL, a sales-demo domain, ...) are appended
  // through the comma-separated CORS_ALLOWED_ORIGINS variable. Requests served
  // same-origin by this very server (single-container deployment) are always
  // accepted — the browser never applies CORS to them.
  const extraAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const publicOrigins = [process.env.PUBLIC_ORIGIN, ...(process.env.PUBLIC_ORIGINS || '').split(',')]
    .map((origin) => (origin || '').trim().replace(/\/$/, ''))
    .filter(Boolean);

  const allowedOriginPattern =
    process.env.NODE_ENV === 'production'
      ? /^https:\/\/([a-z0-9-]+\.)?yourplatform\.com$/
      : /^https?:\/\/(localhost(:\d+)?|127\.0\.0\.1(:\d+)?|([a-z0-9-]+\.)?yourplatform\.com)$/;

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, '');
      if (
        allowedOriginPattern.test(normalized) ||
        extraAllowedOrigins.includes(normalized) ||
        publicOrigins.includes(normalized)
      ) {
        return callback(null, true);
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-slug'],
    maxAge: 86400, // preflight cache 24h
  });

  // ─── Global Prefix ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── Validation ───────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // strip unknown properties
      transform: true,            // auto-transform payloads to DTO classes
      forbidNonWhitelisted: true, // throw on unknown properties
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── Health probe (also verifies database connectivity) ───────────────────
  app.getHttpAdapter().get('/api/v1/health', async (_req: any, res: any) => {
    try {
      await app.get(DataSource).query('SELECT 1');
      res.status(200).json({ status: 'ok', uptime: Math.round(process.uptime()) });
    } catch (error) {
      res.status(503).json({ status: 'degraded', error: (error as Error).message });
    }
  });

  // ─── Static web app (single-origin deployment) ────────────────────────────
  // `apps/api/public` holds the Vite build of apps/web. When present, the API
  // serves the SPA on the same origin, so no CORS and one public URL.
  const webDist = join(__dirname, '..', 'public');
  if (existsSync(join(webDist, 'index.html'))) {
    app.useStaticAssets(webDist, { index: false, maxAge: '1h' });
    // SPA fallback: any non-API GET without a file extension returns index.html.
    app.use((req: any, res: any, next: any) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      if (req.path.startsWith('/api/')) return next();
      if (/\.[a-z0-9]+$/i.test(req.path)) return next();
      res.sendFile(join(webDist, 'index.html'));
    });
    logger.log(`Serving web app from ${webDist}`);
  } else {
    logger.warn(`No web build at ${webDist} — API-only mode`);
  }

  return app;
}

async function bootstrap() {
  const app = await createApp();
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(`Entrustic Beauty API running on port ${port}`);
  logger.log(`   Environment: ${process.env.NODE_ENV ?? 'development'}`);
}

// Open a port only when this file is the process entry point (`node dist/main`).
// A serverless adapter imports `createApp` and must not start listening.
if (require.main === module) {
  bootstrap();
}
