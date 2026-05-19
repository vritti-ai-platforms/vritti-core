-- Creates a non-owner application role for the commerce-service DB connection.
-- RLS policies are skipped for the table owner by default; this role bypasses that.
-- After running: set PRIMARY_DB_USERNAME=vritti_core_app and PRIMARY_DB_PASSWORD to the chosen password.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vritti_core_app') THEN
    CREATE ROLE vritti_core_app WITH LOGIN;
  END IF;
END
$$;--> statement-breakpoint

GRANT USAGE ON SCHEMA vritti_core TO vritti_core_app;--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA vritti_core TO vritti_core_app;--> statement-breakpoint

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA vritti_core TO vritti_core_app;--> statement-breakpoint

-- Ensures future tables created by the owner are also accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA vritti_core GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO vritti_core_app;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA vritti_core GRANT USAGE, SELECT ON SEQUENCES TO vritti_core_app;
