/**
 * TypeORM Data Source — used by CLI migrations only
 * (App uses TypeOrmModule.forRootAsync in app.module.ts)
 *
 * Usage:
 *   pnpm --filter @clinic/api migration:generate -- -n MigrationName
 *   pnpm --filter @clinic/api migration:run
 *   pnpm --filter @clinic/api migration:revert
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env.example') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'clinic_platform_dev',
  synchronize: false,
  logging: true,
  // Entities — glob patterns for compiled JS in dist
  entities: [path.join(__dirname, '../modules/**/entities/*.entity.{ts,js}')],
  // Migrations directory
  migrations: [path.join(__dirname, '../database/migrations/*.{ts,js}')],
  migrationsTableName: 'typeorm_migrations',
});
