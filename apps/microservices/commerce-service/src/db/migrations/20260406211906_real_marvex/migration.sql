CREATE TYPE "vritti_core"."field_type" AS ENUM('text', 'number', 'boolean', 'select');--> statement-breakpoint
CREATE TYPE "vritti_core"."tax_rate_type" AS ENUM('inclusive', 'exclusive');--> statement-breakpoint
CREATE TABLE "vritti_core"."item_field_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"business_unit_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"field_type" "vritti_core"."field_type" NOT NULL,
	"options" jsonb DEFAULT '[]' NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."item_field_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"item_id" uuid NOT NULL,
	"field_definition_id" uuid NOT NULL,
	"value" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."tax_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"tax_group_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"rate" numeric(5,2) NOT NULL,
	"type" "vritti_core"."tax_rate_type" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."items" DROP COLUMN "cost_price";--> statement-breakpoint
ALTER TABLE "vritti_core"."items" DROP COLUMN "hsn_sac_code";--> statement-breakpoint
ALTER TABLE "vritti_core"."items" DROP COLUMN "is_visible";--> statement-breakpoint
ALTER TABLE "vritti_core"."items" DROP COLUMN "track_inventory";--> statement-breakpoint
ALTER TABLE "vritti_core"."item_variants" DROP COLUMN "cost_price";--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_groups" DROP COLUMN "rate";--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_groups" DROP COLUMN "hsn_sac_code";--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_groups" DROP COLUMN "cgst_rate";--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_groups" DROP COLUMN "sgst_rate";--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_groups" DROP COLUMN "igst_rate";--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_groups" DROP COLUMN "cess_rate";--> statement-breakpoint
CREATE UNIQUE INDEX "uq_item_field_value" ON "vritti_core"."item_field_values" ("item_id","field_definition_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."item_field_values" ADD CONSTRAINT "item_field_values_item_id_items_id_fkey" FOREIGN KEY ("item_id") REFERENCES "vritti_core"."items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."item_field_values" ADD CONSTRAINT "item_field_values_V0gaE4dkunFk_fkey" FOREIGN KEY ("field_definition_id") REFERENCES "vritti_core"."item_field_definitions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_rates" ADD CONSTRAINT "tax_rates_tax_group_id_tax_groups_id_fkey" FOREIGN KEY ("tax_group_id") REFERENCES "vritti_core"."tax_groups"("id") ON DELETE CASCADE;