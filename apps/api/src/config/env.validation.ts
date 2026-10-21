import { plainToInstance, Transform } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Environment variables are always strings. `@IsNumber()` alone rejects the
 * literal `"5432"` that every deployment supplies, so each numeric field is
 * coerced before validation runs.
 */
const toNumber = () =>
  Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  });

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @toNumber()
  @IsNumber()
  @IsOptional()
  PORT: number = 3001;

  @IsString()
  @IsOptional()
  DATABASE_HOST: string = 'localhost';

  @toNumber()
  @IsNumber()
  @IsOptional()
  DATABASE_PORT: number = 5432;

  @IsString()
  @IsOptional()
  DATABASE_USER: string = 'postgres';

  @IsString()
  @IsOptional()
  DATABASE_NAME: string = 'clinic_platform_dev';

  @IsString()
  @MinLength(16, { message: 'JWT_SECRET must be at least 16 characters long for security' })
  @IsOptional()
  JWT_SECRET: string = 'dev-super-secret-key-change-in-prod-12345';

  @IsString()
  @MinLength(16, {
    message: 'JWT_ACCESS_SECRET must be at least 16 characters long for security',
  })
  @IsOptional()
  JWT_ACCESS_SECRET: string = 'dev-super-secret-access-key-change-in-prod-12345';

  @IsString()
  @MinLength(16, {
    message: 'JWT_REFRESH_SECRET must be at least 16 characters long for security',
  })
  @IsOptional()
  JWT_REFRESH_SECRET: string = 'dev-super-secret-refresh-key-change-in-prod-12345';

  @IsString()
  @IsOptional()
  BASE_DOMAIN: string = 'yourplatform.com';
}

/**
 * Secrets that are hard-coded as development fallbacks in this file. Shipping
 * any of them to production would let anyone forge a valid access token, so the
 * deployment is refused instead.
 */
const DEV_FALLBACK_SECRETS = new Set([
  'dev-super-secret-key-change-in-prod-12345',
  'dev-super-secret-access-key-change-in-prod-12345',
  'dev-super-secret-refresh-key-change-in-prod-12345',
]);

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.toString()}`);
  }

  const isProduction = validatedConfig.NODE_ENV === Environment.Production;
  if (isProduction) {
    // Only JWT_ACCESS_SECRET is enforced: it is the single signing key the API
    // reads today (auth.module.ts + jwt.strategy.ts). JWT_REFRESH_SECRET is
    // reserved for the refresh-token flow, which does not exist yet — requiring
    // it would block deploying a working build.
    const secret = config['JWT_ACCESS_SECRET'];
    if (typeof secret !== 'string' || secret.length < 16) {
      throw new Error(
        'Environment validation failed: JWT_ACCESS_SECRET must be set to a ' +
          'value of at least 16 characters in production.',
      );
    }
    if (DEV_FALLBACK_SECRETS.has(secret)) {
      throw new Error(
        'Environment validation failed: JWT_ACCESS_SECRET is still the ' +
          'development fallback secret — set a unique production value.',
      );
    }
  }

  return validatedConfig;
}
