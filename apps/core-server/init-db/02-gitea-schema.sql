-- Gitea shares this database but connects as its OWN least-privilege login role (`gitea`) and keeps
-- its tables in a dedicated `gitea` schema it owns — isolated from core's `core`/`commerce` schemas,
-- with no privileges on them. Gitea (GITEA__database__SCHEMA=gitea) creates neither the role nor the
-- schema itself. Runs ONCE on a fresh data dir — for an existing volume, apply the same statements
-- manually (guard CREATE ROLE with a DO block so it is idempotent).
CREATE ROLE gitea LOGIN PASSWORD 'Vritti@0322';
CREATE SCHEMA IF NOT EXISTS gitea AUTHORIZATION gitea;
GRANT CONNECT ON DATABASE vritti_local TO gitea;
