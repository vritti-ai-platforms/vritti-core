-- ============================================================================
-- Variant components (multi-inventory sale-time link).
--   * offering_variants drops the single inventory_item_id and unused bom_id.
--   * New offering_variant_components junction carries per-line quantity so a
--     variant can draw down several inventory items on sale (combos/kits).
--   * Manufacturing bom/bom_lines stay untouched.
-- ============================================================================

ALTER TABLE "vritti_core"."offering_variants" DROP COLUMN IF EXISTS "inventory_item_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_variants" DROP COLUMN IF EXISTS "bom_id";--> statement-breakpoint

CREATE TABLE "vritti_core"."offering_variant_components" (
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"offering_variant_id" uuid NOT NULL REFERENCES "vritti_core"."offering_variants"("id") ON DELETE CASCADE,
	"inventory_item_id" uuid NOT NULL REFERENCES "vritti_core"."inventory_items"("id") ON DELETE RESTRICT,
	"quantity" numeric(12, 3) DEFAULT 1 NOT NULL,
	CONSTRAINT "offering_variant_components_pkey" PRIMARY KEY ("offering_variant_id","inventory_item_id")
);--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_variant_components" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."offering_variant_components" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE INDEX "idx_offering_variant_components_item" ON "vritti_core"."offering_variant_components" ("inventory_item_id");--> statement-breakpoint

-- ============================================================================
-- Re-run the schema-wide grant so the app role can reach the new table
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "vritti_core" TO "vritti_core_app";--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "vritti_core" TO "vritti_core_app";
