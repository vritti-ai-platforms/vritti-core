-- ============================================================================
-- Drop the offerings code and sac_code columns.
--   * code is fully retired (SKU now derives from variants).
--   * sac_code is removed from offerings.
-- ============================================================================

ALTER TABLE "vritti_core"."offerings" DROP CONSTRAINT IF EXISTS "uq_offerings_org_code";--> statement-breakpoint
ALTER TABLE "vritti_core"."offerings" DROP COLUMN IF EXISTS "code";--> statement-breakpoint
ALTER TABLE "vritti_core"."offerings" DROP COLUMN IF EXISTS "sac_code";--> statement-breakpoint

-- ============================================================================
-- Re-run the schema-wide grant so the app role keeps full table access
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "vritti_core" TO "vritti_core_app";--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "vritti_core" TO "vritti_core_app";
