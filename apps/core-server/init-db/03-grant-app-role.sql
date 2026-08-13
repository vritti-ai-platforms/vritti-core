-- Grants the least-privilege runtime role (vritti_core_app) the DML privileges it needs on the
-- `core` schema. Mirrors what runMigrationsAndGrants applies on deploy, kept here so local dev can
-- re-apply grants after migrations without a build (see the `db:grant` script).
--
-- SAFE to auto-run as an init script: on a fresh data dir the `core` schema does not exist yet
-- (migrations haven't run), so the guards below make it a no-op. Re-run it AFTER migrations, as the
-- owner, to grant the runtime role access to newly created objects. Idempotent.
--
-- commerce-service owns the `commerce` schema and grants it separately (see that service's init-db).
DO $$
DECLARE
  target_role   text := 'vritti_core_app';
  target_schema text := 'core';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = target_role) THEN
    RAISE NOTICE 'Role % does not exist; skipping grants', target_role;
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = target_schema) THEN
    RAISE NOTICE 'Schema % does not exist yet; skipping (run migrations first)', target_schema;
    RETURN;
  END IF;

  EXECUTE format('GRANT USAGE ON SCHEMA %I TO %I', target_schema, target_role);
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES   IN SCHEMA %I TO %I', target_schema, target_role);
  EXECUTE format('GRANT USAGE, SELECT                  ON ALL SEQUENCES IN SCHEMA %I TO %I', target_schema, target_role);
  EXECUTE format('GRANT EXECUTE                        ON ALL FUNCTIONS IN SCHEMA %I TO %I', target_schema, target_role);
  -- Auto-grant future objects created by the owner (matches runMigrationsAndGrants).
  EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES    TO %I', target_schema, target_role);
  EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT USAGE, SELECT                  ON SEQUENCES TO %I', target_schema, target_role);
  EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT EXECUTE                        ON FUNCTIONS TO %I', target_schema, target_role);

  RAISE NOTICE 'Granted % privileges on schema %', target_role, target_schema;
END $$;
