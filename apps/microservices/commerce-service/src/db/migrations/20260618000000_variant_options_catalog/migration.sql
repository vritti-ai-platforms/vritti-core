-- ============================================================================
-- Variant options move from offering-level to catalog-level templates.
--   * New tables: variant_options + variant_option_values (catalog-scoped vocab).
--   * offering_options is repurposed into an axes junction (offering -> variant_option).
--   * offering_option_values is dropped (values now live on the catalog).
--   * offering_variant_option_values re-points option_value_id -> variant_option_value_id.
-- Dev DB clean break: dependent variant/axis/value rows are cleared first.
-- ============================================================================

DELETE FROM "vritti_core"."offering_variant_option_values";--> statement-breakpoint
DELETE FROM "vritti_core"."offering_variants";--> statement-breakpoint
DELETE FROM "vritti_core"."offering_option_values";--> statement-breakpoint
DELETE FROM "vritti_core"."offering_options";--> statement-breakpoint

-- ============================================================================
-- Catalog-level variant option templates
-- ============================================================================

CREATE TABLE "vritti_core"."variant_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"catalog_id" uuid NOT NULL REFERENCES "vritti_core"."catalogs"("id") ON DELETE CASCADE,
	"name" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_variant_options_catalog_name" UNIQUE("catalog_id","name")
);--> statement-breakpoint
ALTER TABLE "vritti_core"."variant_options" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."variant_options" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE INDEX "idx_variant_options_catalog" ON "vritti_core"."variant_options" ("catalog_id");--> statement-breakpoint

CREATE TABLE "vritti_core"."variant_option_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"variant_option_id" uuid NOT NULL REFERENCES "vritti_core"."variant_options"("id") ON DELETE CASCADE,
	"value" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "uq_variant_option_values_option_value" UNIQUE("variant_option_id","value")
);--> statement-breakpoint
ALTER TABLE "vritti_core"."variant_option_values" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."variant_option_values" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE INDEX "idx_variant_option_values_option" ON "vritti_core"."variant_option_values" ("variant_option_id");--> statement-breakpoint

-- ============================================================================
-- Repurpose offering_options into the offering -> variant_option axes junction
-- ============================================================================

ALTER TABLE "vritti_core"."offering_options" DROP CONSTRAINT IF EXISTS "uq_offering_options_offering_name";--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_options" DROP CONSTRAINT IF EXISTS "item_options_pkey";--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_options" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_options" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_options"
	ADD COLUMN "variant_option_id" uuid NOT NULL REFERENCES "vritti_core"."variant_options"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_options"
	ADD CONSTRAINT "offering_options_offering_id_fk" FOREIGN KEY ("offering_id") REFERENCES "vritti_core"."offerings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_options"
	ADD CONSTRAINT "offering_options_pkey" PRIMARY KEY ("offering_id","variant_option_id");--> statement-breakpoint
CREATE INDEX "idx_offering_options_offering" ON "vritti_core"."offering_options" ("offering_id");--> statement-breakpoint

-- ============================================================================
-- Drop offering_option_values (values live on the catalog now)
-- ============================================================================

DROP TABLE "vritti_core"."offering_option_values";--> statement-breakpoint

-- ============================================================================
-- Re-point offering_variant_option_values to catalog variant_option_values
-- ============================================================================

ALTER TABLE "vritti_core"."offering_variant_option_values" RENAME COLUMN "option_value_id" TO "variant_option_value_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_variant_option_values"
	ADD CONSTRAINT "offering_variant_option_values_value_fk" FOREIGN KEY ("variant_option_value_id") REFERENCES "vritti_core"."variant_option_values"("id") ON DELETE RESTRICT;--> statement-breakpoint
CREATE INDEX "idx_offering_variant_option_values_value" ON "vritti_core"."offering_variant_option_values" ("variant_option_value_id");--> statement-breakpoint

-- ============================================================================
-- Re-run the schema-wide grant so the app role can reach the new tables
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "vritti_core" TO "vritti_core_app";--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "vritti_core" TO "vritti_core_app";
