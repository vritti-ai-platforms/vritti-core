-- The Phase 1 cost-tracking migration created three new tables (cost_categories,
-- inventory_item_costs, inventory_item_quant_costs) but the ALTER DEFAULT PRIVILEGES set up by
-- 20260519140000_create_app_role didn't propagate to them — probably because the migration ran
-- under a session that didn't inherit the role's defaults. Without these grants the app role
-- (`vritti_core_app`) gets "permission denied for table cost_categories" on every SELECT.
--
-- Fix: grant the three new tables explicitly + re-run the schema-wide grant to catch any others
-- that slipped through. The blanket re-grant is idempotent.

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "vritti_core" TO "vritti_core_app";--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "vritti_core" TO "vritti_core_app";
