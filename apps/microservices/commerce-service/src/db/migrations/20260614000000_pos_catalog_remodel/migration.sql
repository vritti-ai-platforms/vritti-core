-- POS catalog & pricing remodel (Phase 1).
--   * New enums: sales_channel_kind, fulfilment_type.
--   * Renames items -> offerings, item_variants -> offering_variants (+ options/values), item_modifier_groups
--     -> offering_modifier_groups, and the order_items FK columns.
--   * offerings: drops catalog_item_type `type`, adds fulfilment_type + sac_code, renames tax_group_id ->
--     sales_tax_group_id.
--   * offering_variants: adds inventory_item_id, drops manage_inventory.
--   * inventory_items: adds purchase_tax_group_id + hsn_code (Phase-2 GST hooks).
--   * orders + pos_terminals: add channel_id -> sales_channels.
--   * New tables: sales_channels (org-scoped), catalogs (BU-scoped), catalog_items (org-scoped).
--   * Drops the price-list trio: terminal_price_lists, price_list_items, price_lists.
-- No production data to preserve; the offerings.type -> fulfilment_type backfill keeps dev rows valid.

CREATE TYPE "vritti_core"."sales_channel_kind" AS ENUM ('IN_STORE', 'ONLINE', 'ZOMATO', 'SWIGGY', 'OTHER');--> statement-breakpoint
CREATE TYPE "vritti_core"."fulfilment_type" AS ENUM ('STOCK', 'SERVICE', 'COMPOSITE');--> statement-breakpoint

-- ============================================================================
-- Rename tables
-- ============================================================================

ALTER TABLE "vritti_core"."items" RENAME TO "offerings";--> statement-breakpoint
ALTER TABLE "vritti_core"."item_variants" RENAME TO "offering_variants";--> statement-breakpoint
ALTER TABLE "vritti_core"."item_options" RENAME TO "offering_options";--> statement-breakpoint
ALTER TABLE "vritti_core"."item_option_values" RENAME TO "offering_option_values";--> statement-breakpoint
ALTER TABLE "vritti_core"."item_variant_option_values" RENAME TO "offering_variant_option_values";--> statement-breakpoint
ALTER TABLE "vritti_core"."item_modifier_groups" RENAME TO "offering_modifier_groups";--> statement-breakpoint

-- ============================================================================
-- Rename FK columns
-- ============================================================================

ALTER TABLE "vritti_core"."offering_options" RENAME COLUMN "item_id" TO "offering_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_variants" RENAME COLUMN "item_id" TO "offering_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_variant_option_values" RENAME COLUMN "variant_id" TO "offering_variant_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_modifier_groups" RENAME COLUMN "item_id" TO "offering_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."order_items" RENAME COLUMN "item_id" TO "offering_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."order_items" RENAME COLUMN "variant_id" TO "offering_variant_id";--> statement-breakpoint

-- ============================================================================
-- Rename indexes to match the new table names
-- ============================================================================

ALTER INDEX "vritti_core"."uq_items_org_code" RENAME TO "uq_offerings_org_code";--> statement-breakpoint
ALTER INDEX "vritti_core"."idx_items_bu" RENAME TO "idx_offerings_bu";--> statement-breakpoint
ALTER INDEX "vritti_core"."idx_items_category" RENAME TO "idx_offerings_category";--> statement-breakpoint
ALTER INDEX "vritti_core"."uq_item_options_item_name" RENAME TO "uq_offering_options_offering_name";--> statement-breakpoint
ALTER INDEX "vritti_core"."uq_item_option_values_option_value" RENAME TO "uq_offering_option_values_option_value";--> statement-breakpoint
ALTER INDEX "vritti_core"."uq_item_variants_item_sku" RENAME TO "uq_offering_variants_offering_sku";--> statement-breakpoint
ALTER INDEX "vritti_core"."idx_item_variants_item" RENAME TO "idx_offering_variants_offering";--> statement-breakpoint

-- ============================================================================
-- offerings column changes
-- ============================================================================

ALTER TABLE "vritti_core"."offerings" ADD COLUMN "fulfilment_type" "vritti_core"."fulfilment_type";--> statement-breakpoint
UPDATE "vritti_core"."offerings"
  SET "fulfilment_type" = (CASE WHEN "type" = 'SERVICE' THEN 'SERVICE' ELSE 'STOCK' END)::"vritti_core"."fulfilment_type";--> statement-breakpoint
ALTER TABLE "vritti_core"."offerings" ALTER COLUMN "fulfilment_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."offerings" RENAME COLUMN "tax_group_id" TO "sales_tax_group_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."offerings" ADD COLUMN "sac_code" varchar(50);--> statement-breakpoint
ALTER TABLE "vritti_core"."offerings" DROP COLUMN "type";--> statement-breakpoint

-- ============================================================================
-- offering_variants column changes
-- ============================================================================

ALTER TABLE "vritti_core"."offering_variants" ADD COLUMN "inventory_item_id" uuid;--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_variants"
  ADD CONSTRAINT "offering_variants_inventory_item_id_fkey"
  FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_variants" DROP COLUMN "manage_inventory";--> statement-breakpoint

-- ============================================================================
-- inventory_items: Phase-2 GST hooks
-- ============================================================================

ALTER TABLE "vritti_core"."inventory_items" ADD COLUMN "purchase_tax_group_id" uuid;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items"
  ADD CONSTRAINT "inventory_items_purchase_tax_group_id_fkey"
  FOREIGN KEY ("purchase_tax_group_id") REFERENCES "vritti_core"."tax_groups"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" ADD COLUMN "hsn_code" varchar(20);--> statement-breakpoint

-- ============================================================================
-- sales_channels (org-scoped)
-- ============================================================================

CREATE TABLE "vritti_core"."sales_channels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
  "code" varchar(50) NOT NULL,
  "name" varchar(255) NOT NULL,
  "kind" "vritti_core"."sales_channel_kind" NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "is_system" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "vritti_core"."sales_channels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_sales_channels_org_code" ON "vritti_core"."sales_channels" ("organization_id", "code");--> statement-breakpoint
CREATE INDEX "idx_sales_channels_org" ON "vritti_core"."sales_channels" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_sales_channels_kind" ON "vritti_core"."sales_channels" ("kind");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."sales_channels" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint

-- ============================================================================
-- orders + pos_terminals: channel_id
-- ============================================================================

ALTER TABLE "vritti_core"."orders" ADD COLUMN "channel_id" uuid;--> statement-breakpoint
ALTER TABLE "vritti_core"."orders"
  ADD CONSTRAINT "orders_channel_id_fkey"
  FOREIGN KEY ("channel_id") REFERENCES "vritti_core"."sales_channels"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."pos_terminals" ADD COLUMN "channel_id" uuid;--> statement-breakpoint
ALTER TABLE "vritti_core"."pos_terminals"
  ADD CONSTRAINT "pos_terminals_channel_id_fkey"
  FOREIGN KEY ("channel_id") REFERENCES "vritti_core"."sales_channels"("id") ON DELETE SET NULL;--> statement-breakpoint

-- ============================================================================
-- catalogs (BU-scoped)
-- ============================================================================

CREATE TABLE "vritti_core"."catalogs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
  "business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
  "channel_id" uuid NOT NULL,
  "name" varchar(255),
  "tax_inclusive" boolean NOT NULL DEFAULT false,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "vritti_core"."catalogs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vritti_core"."catalogs"
  ADD CONSTRAINT "catalogs_channel_id_fkey"
  FOREIGN KEY ("channel_id") REFERENCES "vritti_core"."sales_channels"("id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_catalogs_bu_channel" ON "vritti_core"."catalogs" ("business_unit_id", "channel_id");--> statement-breakpoint
CREATE INDEX "idx_catalogs_bu" ON "vritti_core"."catalogs" ("organization_id", "business_unit_id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."catalogs" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."catalogs" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."catalogs" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."catalogs" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."catalogs" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint

-- ============================================================================
-- catalog_items (org-scoped; catalog FK enforces BU scope)
-- ============================================================================

CREATE TABLE "vritti_core"."catalog_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
  "catalog_id" uuid NOT NULL,
  "offering_variant_id" uuid NOT NULL,
  "price" bigint,
  "is_available" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "vritti_core"."catalog_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vritti_core"."catalog_items"
  ADD CONSTRAINT "catalog_items_catalog_id_fkey"
  FOREIGN KEY ("catalog_id") REFERENCES "vritti_core"."catalogs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."catalog_items"
  ADD CONSTRAINT "catalog_items_offering_variant_id_fkey"
  FOREIGN KEY ("offering_variant_id") REFERENCES "vritti_core"."offering_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_catalog_items_catalog_variant" ON "vritti_core"."catalog_items" ("catalog_id", "offering_variant_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_items_catalog" ON "vritti_core"."catalog_items" ("catalog_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_items_variant" ON "vritti_core"."catalog_items" ("offering_variant_id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."catalog_items" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint

-- ============================================================================
-- Drop the price-list trio (children first)
-- ============================================================================

DROP TABLE "vritti_core"."terminal_price_lists";--> statement-breakpoint
DROP TABLE "vritti_core"."price_list_items";--> statement-breakpoint
DROP TABLE "vritti_core"."price_lists";--> statement-breakpoint

-- ============================================================================
-- Re-run the schema-wide grant so the app role can reach the new tables
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "vritti_core" TO "vritti_core_app";--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "vritti_core" TO "vritti_core_app";
