CREATE TABLE "vritti_core"."tax_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"business_unit_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"rate" numeric(5,2) NOT NULL,
	"hsn_sac_code" varchar(8),
	"cgst_rate" numeric(5,2) DEFAULT '0' NOT NULL,
	"sgst_rate" numeric(5,2) DEFAULT '0' NOT NULL,
	"igst_rate" numeric(5,2) DEFAULT '0' NOT NULL,
	"cess_rate" numeric(5,2) DEFAULT '0' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."catalog_items" RENAME TO "items";--> statement-breakpoint
ALTER TABLE "vritti_core"."items" DROP CONSTRAINT "uq_catalog_items_bu_code";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_catalog_items_bu";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_catalog_items_category";--> statement-breakpoint
ALTER TABLE "vritti_core"."items" ADD CONSTRAINT "uq_items_bu_code" UNIQUE("business_unit_id","code");--> statement-breakpoint
CREATE INDEX "idx_items_bu" ON "vritti_core"."items" ("business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_items_category" ON "vritti_core"."items" ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tax_groups_bu_name_unique" ON "vritti_core"."tax_groups" ("business_unit_id","name");