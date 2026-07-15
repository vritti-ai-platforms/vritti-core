CREATE TABLE "vritti_core"."inventory_item_mrps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"amount" bigint NOT NULL,
	"source_lot_id" uuid,
	"sourced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inventory_item_mrps_item_currency" UNIQUE("inventory_item_id","currency_code")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_mrps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."inventory_item_sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"is_stocked" boolean DEFAULT true NOT NULL,
	"reorder_point" numeric(12,3) DEFAULT '0' NOT NULL,
	"max_stock_level" numeric(12,3) DEFAULT '0' NOT NULL,
	"safety_stock" numeric(12,3) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inventory_item_sites" UNIQUE("inventory_item_id","site_id")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_sites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP VIEW "vritti_core"."inventory_stock_levels";--> statement-breakpoint
DROP POLICY "site_read" ON "vritti_core"."supplier_contacts";--> statement-breakpoint
DROP POLICY "site_write" ON "vritti_core"."supplier_contacts";--> statement-breakpoint
DROP POLICY "site_update" ON "vritti_core"."supplier_contacts";--> statement-breakpoint
DROP POLICY "site_delete" ON "vritti_core"."supplier_contacts";--> statement-breakpoint
DROP POLICY "site_read" ON "vritti_core"."suppliers";--> statement-breakpoint
DROP POLICY "site_write" ON "vritti_core"."suppliers";--> statement-breakpoint
DROP POLICY "site_update" ON "vritti_core"."suppliers";--> statement-breakpoint
DROP POLICY "site_delete" ON "vritti_core"."suppliers";--> statement-breakpoint
DROP POLICY "site_read" ON "vritti_core"."tax_groups";--> statement-breakpoint
DROP POLICY "site_write" ON "vritti_core"."tax_groups";--> statement-breakpoint
DROP POLICY "site_update" ON "vritti_core"."tax_groups";--> statement-breakpoint
DROP POLICY "site_delete" ON "vritti_core"."tax_groups";--> statement-breakpoint
DROP POLICY "site_read" ON "vritti_core"."inventory_items";--> statement-breakpoint
DROP POLICY "site_write" ON "vritti_core"."inventory_items";--> statement-breakpoint
DROP POLICY "site_update" ON "vritti_core"."inventory_items";--> statement-breakpoint
DROP POLICY "site_delete" ON "vritti_core"."inventory_items";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" DROP CONSTRAINT "inventory_items_purchase_tax_group_id_tax_groups_id_fkey";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" DROP CONSTRAINT "uq_inventory_items_bu_code";--> statement-breakpoint
DROP INDEX "vritti_core"."uq_suppliers_bu_code";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_suppliers_site";--> statement-breakpoint
DROP INDEX "vritti_core"."tax_groups_bu_name_unique";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_inventory_items_site";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_locations" ADD COLUMN "is_preferred" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_locations" ADD COLUMN "min_level" numeric(12,3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_locations" ADD COLUMN "max_level" numeric(12,3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_locations" ADD COLUMN "safety_stock" numeric(12,3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_locations" ADD COLUMN "bin_capacity" numeric(12,3);--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_contacts" ADD COLUMN "legal_entity_id" uuid;--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_contacts" ALTER COLUMN "legal_entity_id" SET DEFAULT cast(current_setting('app.le_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_contacts" ALTER COLUMN "legal_entity_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" ADD COLUMN "legal_entity_id" uuid;--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" ALTER COLUMN "legal_entity_id" SET DEFAULT cast(current_setting('app.le_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" ALTER COLUMN "legal_entity_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_groups" ADD COLUMN "legal_entity_id" uuid;--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_groups" ALTER COLUMN "legal_entity_id" SET DEFAULT cast(current_setting('app.le_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_groups" ALTER COLUMN "legal_entity_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_locations" DROP COLUMN "reorder_level";--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_contacts" DROP COLUMN "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" DROP COLUMN "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_groups" DROP COLUMN "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" DROP COLUMN "purchase_tax_group_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" DROP COLUMN "default_mrp";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" DROP COLUMN "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" ADD CONSTRAINT "uq_inventory_items_org_code" UNIQUE("organization_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_iil_one_preferred" ON "vritti_core"."inventory_item_locations" ("inventory_item_id","site_id") WHERE is_preferred = true;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_suppliers_le_code" ON "vritti_core"."suppliers" ("legal_entity_id","code");--> statement-breakpoint
CREATE INDEX "idx_suppliers_le" ON "vritti_core"."suppliers" ("organization_id","legal_entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tax_groups_le_name_unique" ON "vritti_core"."tax_groups" ("legal_entity_id","name");--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_mrps" ADD CONSTRAINT "inventory_item_mrps_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_mrps" ADD CONSTRAINT "inventory_item_mrps_source_lot_id_inventory_item_lots_id_fkey" FOREIGN KEY ("source_lot_id") REFERENCES "vritti_core"."inventory_item_lots"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_sites" ADD CONSTRAINT "inventory_item_sites_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE VIEW "vritti_core"."inventory_stock_levels" AS (select COALESCE("q"."inventory_item_id", "vritti_core"."inventory_item_locations"."inventory_item_id") as "inventory_item_id", COALESCE("q"."location_id", "vritti_core"."inventory_item_locations"."location_id") as "location_id", CAST(COALESCE("q"."stocked", 0) AS TEXT) as "stocked_quantity", CAST(COALESCE("q"."reserved", 0) AS TEXT) as "reserved_quantity", CAST(COALESCE("q"."available", 0) AS TEXT) as "available_quantity", "vritti_core"."inventory_item_locations"."min_level" from (select "inventory_item_id", "location_id", SUM("quantity") as "stocked", SUM("reserved_quantity") as "reserved", SUM("quantity" - "reserved_quantity") as "available" from "vritti_core"."inventory_item_quants" group by "vritti_core"."inventory_item_quants"."inventory_item_id", "vritti_core"."inventory_item_quants"."location_id") "q" full join "vritti_core"."inventory_item_locations" on "q"."inventory_item_id" = "vritti_core"."inventory_item_locations"."inventory_item_id" AND "q"."location_id" = "vritti_core"."inventory_item_locations"."location_id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."inventory_item_mrps" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."inventory_item_sites" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."inventory_item_sites" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."inventory_item_sites" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."inventory_item_sites" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."inventory_item_sites" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "le_read" ON "vritti_core"."supplier_contacts" AS PERMISSIVE FOR SELECT TO public USING (legal_entity_id = current_setting('app.le_id')::uuid);--> statement-breakpoint
CREATE POLICY "le_write" ON "vritti_core"."supplier_contacts" AS PERMISSIVE FOR INSERT TO public WITH CHECK (legal_entity_id = current_setting('app.le_id')::uuid);--> statement-breakpoint
CREATE POLICY "le_update" ON "vritti_core"."supplier_contacts" AS PERMISSIVE FOR UPDATE TO public USING (legal_entity_id = current_setting('app.le_id')::uuid);--> statement-breakpoint
CREATE POLICY "le_delete" ON "vritti_core"."supplier_contacts" AS PERMISSIVE FOR DELETE TO public USING (legal_entity_id = current_setting('app.le_id')::uuid);--> statement-breakpoint
CREATE POLICY "le_read" ON "vritti_core"."suppliers" AS PERMISSIVE FOR SELECT TO public USING (legal_entity_id = current_setting('app.le_id')::uuid);--> statement-breakpoint
CREATE POLICY "le_write" ON "vritti_core"."suppliers" AS PERMISSIVE FOR INSERT TO public WITH CHECK (legal_entity_id = current_setting('app.le_id')::uuid);--> statement-breakpoint
CREATE POLICY "le_update" ON "vritti_core"."suppliers" AS PERMISSIVE FOR UPDATE TO public USING (legal_entity_id = current_setting('app.le_id')::uuid);--> statement-breakpoint
CREATE POLICY "le_delete" ON "vritti_core"."suppliers" AS PERMISSIVE FOR DELETE TO public USING (legal_entity_id = current_setting('app.le_id')::uuid);--> statement-breakpoint
CREATE POLICY "le_read" ON "vritti_core"."tax_groups" AS PERMISSIVE FOR SELECT TO public USING (legal_entity_id = current_setting('app.le_id')::uuid);--> statement-breakpoint
CREATE POLICY "le_write" ON "vritti_core"."tax_groups" AS PERMISSIVE FOR INSERT TO public WITH CHECK (legal_entity_id = current_setting('app.le_id')::uuid);--> statement-breakpoint
CREATE POLICY "le_update" ON "vritti_core"."tax_groups" AS PERMISSIVE FOR UPDATE TO public USING (legal_entity_id = current_setting('app.le_id')::uuid);--> statement-breakpoint
CREATE POLICY "le_delete" ON "vritti_core"."tax_groups" AS PERMISSIVE FOR DELETE TO public USING (legal_entity_id = current_setting('app.le_id')::uuid);