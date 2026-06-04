-- ============================================================================
-- Catalog becomes the aggregate root: offerings + modifier groups live under a
-- catalog; POS terminals point at a catalog; the catalog_items override layer
-- is dropped (price = offering_variant.price). Dev DB has no production data, so
-- existing catalog content is cleared to satisfy the new NOT NULL catalog_id.
-- ============================================================================

DELETE FROM "vritti_core"."order_item_modifiers";--> statement-breakpoint
DELETE FROM "vritti_core"."order_items";--> statement-breakpoint
DELETE FROM "vritti_core"."offering_modifier_groups";--> statement-breakpoint
DELETE FROM "vritti_core"."modifier_options";--> statement-breakpoint
DELETE FROM "vritti_core"."modifier_groups";--> statement-breakpoint
DELETE FROM "vritti_core"."offering_variant_option_values";--> statement-breakpoint
DELETE FROM "vritti_core"."offering_option_values";--> statement-breakpoint
DELETE FROM "vritti_core"."offering_options";--> statement-breakpoint
DELETE FROM "vritti_core"."offering_variants";--> statement-breakpoint
DELETE FROM "vritti_core"."item_field_values";--> statement-breakpoint
DELETE FROM "vritti_core"."offerings";--> statement-breakpoint

DROP TABLE "vritti_core"."catalog_items";--> statement-breakpoint

ALTER TABLE "vritti_core"."offerings"
  ADD COLUMN "catalog_id" uuid NOT NULL REFERENCES "vritti_core"."catalogs"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE INDEX "idx_offerings_catalog" ON "vritti_core"."offerings" ("catalog_id");--> statement-breakpoint

ALTER TABLE "vritti_core"."modifier_groups"
  ADD COLUMN "catalog_id" uuid NOT NULL REFERENCES "vritti_core"."catalogs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."modifier_groups" DROP CONSTRAINT "uq_modifier_groups_bu_name";--> statement-breakpoint
ALTER TABLE "vritti_core"."modifier_groups"
  ADD CONSTRAINT "uq_modifier_groups_catalog_name" UNIQUE ("catalog_id", "name");--> statement-breakpoint
CREATE INDEX "idx_modifier_groups_catalog" ON "vritti_core"."modifier_groups" ("catalog_id");--> statement-breakpoint

ALTER TABLE "vritti_core"."pos_terminals" DROP COLUMN "channel_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."pos_terminals"
  ADD COLUMN "catalog_id" uuid REFERENCES "vritti_core"."catalogs"("id") ON DELETE SET NULL;--> statement-breakpoint

-- ============================================================================
-- Re-run the schema-wide grant so the app role can reach the altered tables
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "vritti_core" TO "vritti_core_app";--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "vritti_core" TO "vritti_core_app";
