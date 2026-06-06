-- Custom SQL migration file, put your code below! --

-- Defensive copy of the schema + ltree extension (core-server is the canonical owner).
-- Idempotent, so this is harmless if core-server migrated first; it removes the hidden
-- cross-service ordering dependency when commerce-service migrates independently.
CREATE SCHEMA IF NOT EXISTS "vritti_core";
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS ltree SCHEMA "vritti_core";
--> statement-breakpoint
-- Human-readable breadcrumb from an ltree path: 'main.sales.rack_a' -> 'Main › Sales › Rack A'.
-- IMMUTABLE is required because path_breadcrumb is a generated column.
CREATE OR REPLACE FUNCTION vritti_core.format_ltree_path(path vritti_core.ltree)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT string_agg(initcap(replace(label, '_', ' ')), ' › ' ORDER BY ord)
  FROM unnest(string_to_array(path::text, '.')) WITH ORDINALITY AS segments(label, ord);
$$;
