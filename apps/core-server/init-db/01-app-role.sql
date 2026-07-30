-- Local dev only. The container superuser is POSTGRES_USER=vritti_core_owner (owner + migrations).
-- This creates the least-privilege runtime login the app connects as (PRIMARY_DB_USERNAME).
-- Because it is NOT the owner/superuser, Postgres RLS policies actually apply to it — matching prod.
-- runMigrationsAndGrants (run as owner on migrate) grants this role the schema DML privileges.
CREATE ROLE vritti_core_app LOGIN PASSWORD 'Vritti@0322';
