-- Catalog ↔ channel via a per-BU junction.
--   * New table: catalog_channels (BU-scoped) — maps a catalog to many (BU, channel) pairs;
--     each (BU, channel) maps to exactly one catalog (unique on business_unit_id, channel_id).
--   * catalogs: drops the single-channel binding (uq_catalogs_bu_channel + channel_id column).
-- No production data to preserve.

-- ============================================================================
-- catalog_channels (BU-scoped junction)
-- ============================================================================

CREATE TABLE "vritti_core"."catalog_channels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
  "business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
  "catalog_id" uuid NOT NULL,
  "channel_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "vritti_core"."catalog_channels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vritti_core"."catalog_channels"
  ADD CONSTRAINT "catalog_channels_catalog_id_fkey"
  FOREIGN KEY ("catalog_id") REFERENCES "vritti_core"."catalogs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."catalog_channels"
  ADD CONSTRAINT "catalog_channels_channel_id_fkey"
  FOREIGN KEY ("channel_id") REFERENCES "vritti_core"."sales_channels"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_catalog_channels_bu_channel" ON "vritti_core"."catalog_channels" ("business_unit_id", "channel_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_channels_catalog" ON "vritti_core"."catalog_channels" ("catalog_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_channels_channel" ON "vritti_core"."catalog_channels" ("channel_id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."catalog_channels" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."catalog_channels" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."catalog_channels" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."catalog_channels" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."catalog_channels" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint

-- ============================================================================
-- catalogs: drop the single-channel binding
-- ============================================================================

ALTER TABLE "vritti_core"."catalogs" DROP CONSTRAINT IF EXISTS "uq_catalogs_bu_channel";--> statement-breakpoint
ALTER TABLE "vritti_core"."catalogs" DROP COLUMN IF EXISTS "channel_id";--> statement-breakpoint

-- ============================================================================
-- Re-run the schema-wide grant so the app role can reach the new table
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "vritti_core" TO "vritti_core_app";--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "vritti_core" TO "vritti_core_app";
