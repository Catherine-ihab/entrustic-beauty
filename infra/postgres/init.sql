-- ============================================================
-- Clinic Platform — PostgreSQL Initialization Script
-- Runs once on first container start (docker-entrypoint-initdb.d)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Row-Level Security helper function
-- Called by TypeORM's TenantTransactionManager before each query
-- Usage: SELECT set_config('app.current_tenant_id', $1, true);
-- ============================================================
-- The RLS policies are applied per-table in migrations.
-- This init script only sets up extensions and the RLS helper.

-- Allow the application user to set the config parameter
GRANT pg_monitor TO CURRENT_USER;

-- Log that init completed
DO $$
BEGIN
  RAISE NOTICE 'Clinic Platform PostgreSQL init completed. Run migrations next.';
END $$;
