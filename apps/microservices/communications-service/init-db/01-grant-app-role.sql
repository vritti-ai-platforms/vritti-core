-- Grants the least-privilege runtime role (vritti_core_app) the DML privileges it needs on the
-- `communications` schema. communications-service shares core-server's database (vritti_local) but
-- owns its own `communications` schema, so it grants that schema here — the mirror of core-server's
-- core-schema grant and commerce-service's commerce-schema grant.
--
-- Mirrors what runMigrationsAndGrants applies on deploy. Apply it AFTER communications migrations, as
-- the owner, via `pnpm db:grant`. Guarded + idempotent: a no-op until the role and schema exist.
DO $$
DECLARE
  target_role   text := 'vritti_core_app';
  target_schema text := 'communications';
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
