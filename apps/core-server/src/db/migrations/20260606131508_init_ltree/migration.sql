-- Custom SQL migration file, put your code below! --

-- core-server owns the shared schema and the ltree extension (infrastructure).
-- Idempotent so re-runs and the commerce-service copy are safe in any order.
CREATE SCHEMA IF NOT EXISTS "vritti_core";
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS ltree SCHEMA "vritti_core";
