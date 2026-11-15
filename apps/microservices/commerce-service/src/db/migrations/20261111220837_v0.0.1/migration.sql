CREATE TYPE "commerce"."storage_capacity_check" AS ENUM('NONE', 'WARN', 'BLOCK');--> statement-breakpoint
CREATE TABLE "commerce"."inventory_item_storage_types" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"storage_type_id" uuid NOT NULL,
	"max_quantity" numeric(12,3) NOT NULL,
	"uom_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inventory_item_storage_types_item_type" UNIQUE("inventory_item_id","storage_type_id"),
	CONSTRAINT "inventory_item_storage_types_max_quantity_chk" CHECK ("max_quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_storage_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."storage_types" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"max_weight" numeric(12,3),
	"max_volume" numeric(12,3),
	"length" numeric(12,3),
	"width" numeric(12,3),
	"height" numeric(12,3),
	"capacity_check" "commerce"."storage_capacity_check" DEFAULT 'BLOCK'::"commerce"."storage_capacity_check" NOT NULL,
	"allow_mixed_items" boolean DEFAULT true NOT NULL,
	"allow_mixed_batches" boolean DEFAULT false NOT NULL,
	"allow_addition_to_stock" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_storage_types_org_code" UNIQUE("organization_id","code"),
	CONSTRAINT "storage_types_code_chk" CHECK ("code" ~ '^[a-z0-9][a-z0-9-]*$'),
	CONSTRAINT "storage_types_measures_chk" CHECK (("max_weight" IS NULL OR "max_weight" > 0)
        AND ("max_volume" IS NULL OR "max_volume" > 0)
        AND ("length" IS NULL OR "length" > 0)
        AND ("width" IS NULL OR "width" > 0)
        AND ("height" IS NULL OR "height" > 0))
);
--> statement-breakpoint
ALTER TABLE "commerce"."storage_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP VIEW "commerce"."inventory_stock_levels";--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_locations" ADD COLUMN "is_blocked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_quants" ADD COLUMN "pack_uom_id" uuid;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_uom_conversions" ADD COLUMN "weight" numeric(12,3);--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_uom_conversions" ADD COLUMN "volume" numeric(12,3);--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_uom_conversions" ADD COLUMN "length" numeric(12,3);--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_uom_conversions" ADD COLUMN "width" numeric(12,3);--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_uom_conversions" ADD COLUMN "height" numeric(12,3);--> statement-breakpoint
ALTER TABLE "commerce"."inventory_items" ADD COLUMN "weight" numeric(12,3);--> statement-breakpoint
ALTER TABLE "commerce"."inventory_items" ADD COLUMN "volume" numeric(12,3);--> statement-breakpoint
ALTER TABLE "commerce"."inventory_items" ADD COLUMN "length" numeric(12,3);--> statement-breakpoint
ALTER TABLE "commerce"."inventory_items" ADD COLUMN "width" numeric(12,3);--> statement-breakpoint
ALTER TABLE "commerce"."inventory_items" ADD COLUMN "height" numeric(12,3);--> statement-breakpoint
ALTER TABLE "commerce"."locations" ADD COLUMN "storage_type_id" uuid;--> statement-breakpoint
ALTER TABLE "commerce"."locations" ADD COLUMN "is_storage_type_overridden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_locations" DROP COLUMN "min_level";--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_locations" DROP COLUMN "max_level";--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_locations" DROP COLUMN "safety_stock";--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_locations" DROP COLUMN "bin_capacity";--> statement-breakpoint
CREATE INDEX "idx_inventory_item_storage_types_type" ON "commerce"."inventory_item_storage_types" ("storage_type_id");--> statement-breakpoint
CREATE INDEX "idx_locations_storage_type" ON "commerce"."locations" ("storage_type_id");--> statement-breakpoint
CREATE INDEX "idx_storage_types_org" ON "commerce"."storage_types" ("organization_id");--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_quants" ADD CONSTRAINT "inventory_item_quants_pack_uom_id_uom_id_fkey" FOREIGN KEY ("pack_uom_id") REFERENCES "commerce"."uom"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_storage_types" ADD CONSTRAINT "inventory_item_storage_types_WkXyCH81Nqqn_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "commerce"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_storage_types" ADD CONSTRAINT "inventory_item_storage_types_fzsfKMdZEFGT_fkey" FOREIGN KEY ("storage_type_id") REFERENCES "commerce"."storage_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_storage_types" ADD CONSTRAINT "inventory_item_storage_types_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "commerce"."uom"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."locations" ADD CONSTRAINT "locations_storage_type_id_storage_types_id_fkey" FOREIGN KEY ("storage_type_id") REFERENCES "commerce"."storage_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_uom_conversions" ADD CONSTRAINT "inventory_item_uom_conversions_measures_chk" CHECK (("weight" IS NULL OR "weight" > 0)
        AND ("volume" IS NULL OR "volume" > 0)
        AND ("length" IS NULL OR "length" > 0)
        AND ("width" IS NULL OR "width" > 0)
        AND ("height" IS NULL OR "height" > 0));--> statement-breakpoint
ALTER TABLE "commerce"."inventory_items" ADD CONSTRAINT "inventory_items_measures_chk" CHECK (("weight" IS NULL OR "weight" > 0)
        AND ("volume" IS NULL OR "volume" > 0)
        AND ("length" IS NULL OR "length" > 0)
        AND ("width" IS NULL OR "width" > 0)
        AND ("height" IS NULL OR "height" > 0));--> statement-breakpoint
CREATE VIEW "commerce"."inventory_stock_levels" AS (select COALESCE("q"."inventory_item_id", "commerce"."inventory_item_locations"."inventory_item_id") as "inventory_item_id", COALESCE("q"."location_id", "commerce"."inventory_item_locations"."location_id") as "location_id", CAST(COALESCE("q"."stocked", 0) AS TEXT) as "stocked_quantity", CAST(COALESCE("q"."reserved", 0) AS TEXT) as "reserved_quantity", CAST(COALESCE("q"."available", 0) AS TEXT) as "available_quantity" from (select "inventory_item_id", "location_id", SUM("quantity") as "stocked", SUM("reserved_quantity") as "reserved", SUM("quantity" - "reserved_quantity") as "available" from "commerce"."inventory_item_quants" group by "commerce"."inventory_item_quants"."inventory_item_id", "commerce"."inventory_item_quants"."location_id") "q" full join "commerce"."inventory_item_locations" on "q"."inventory_item_id" = "commerce"."inventory_item_locations"."inventory_item_id" AND "q"."location_id" = "commerce"."inventory_item_locations"."location_id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."inventory_item_storage_types" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."storage_types" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));