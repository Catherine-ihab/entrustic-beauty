import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClsService } from 'nestjs-cls';

export const TENANT_SLUG_KEY = 'TENANT_SLUG';
export const TENANT_ID_KEY = 'TENANT_ID';

@Injectable()
export class TenantResolutionMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host || '';
    const hostname = host.split(':')[0]; // remove port

    let slug: string | null = null;

    // Check subdomain (e.g. dental.yourplatform.com or dental.lvh.me)
    const parts = hostname.split('.');
    if (parts.length > 2) {
      const potentialSlug = parts[0].toLowerCase();
      if (!['www', 'api', 'admin', 'app'].includes(potentialSlug)) {
        slug = potentialSlug;
      }
    }

    // Fallback for local development headers if configured
    if (!slug && process.env.NODE_ENV !== 'production' && req.headers['x-tenant-slug']) {
      slug = (req.headers['x-tenant-slug'] as string).toLowerCase();
    }

    if (slug) {
      this.cls.set(TENANT_SLUG_KEY, slug);
    }

    next();
  }
}
