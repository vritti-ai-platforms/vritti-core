CREATE TYPE "vritti_core"."catalog_item_type" AS ENUM('PRODUCT', 'SERVICE');--> statement-breakpoint
CREATE TYPE "vritti_core"."modifier_selection_type" AS ENUM('SINGLE', 'MULTI');--> statement-breakpoint
CREATE TABLE "vritti_core"."catalog_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"business_unit_id" uuid NOT NULL,
	"category_id" uuid,
	"type" "vritti_core"."catalog_item_type" NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"base_price" numeric(12,2) NOT NULL,
	"cost_price" numeric(12,2),
	"tax_group_id" uuid,
	"hsn_sac_code" varchar(8),
	"is_available" boolean DEFAULT true NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"track_inventory" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"attributes" jsonb DEFAULT '{}' NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_catalog_items_bu_code" UNIQUE("business_unit_id","code")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."item_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"item_id" uuid NOT NULL,
	"url" varchar NOT NULL,
	"alt_text" varchar,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."item_option_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"option_id" uuid NOT NULL,
	"value" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "uq_item_option_values_option_value" UNIQUE("option_id","value")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."item_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"item_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "uq_item_options_item_name" UNIQUE("item_id","name")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."item_variant_option_values" (
	"variant_id" uuid,
	"option_value_id" uuid,
	CONSTRAINT "item_variant_option_values_pkey" PRIMARY KEY("variant_id","option_value_id")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."item_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"item_id" uuid NOT NULL,
	"sku" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"price" numeric(12,2),
	"cost_price" numeric(12,2),
	"is_available" boolean DEFAULT true NOT NULL,
	"manage_inventory" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"attributes" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_item_variants_item_sku" UNIQUE("item_id","sku")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."item_modifier_groups" (
	"item_id" uuid,
	"group_id" uuid,
	CONSTRAINT "item_modifier_groups_pkey" PRIMARY KEY("item_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."modifier_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"business_unit_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"selection_type" "vritti_core"."modifier_selection_type" NOT NULL,
	"min_selections" integer DEFAULT 0 NOT NULL,
	"max_selections" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_modifier_groups_bu_name" UNIQUE("business_unit_id","name")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."modifier_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"group_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"additional_price" numeric(12,2) DEFAULT '0' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"attributes" jsonb DEFAULT '{}' NOT NULL,
	CONSTRAINT "uq_modifier_options_group_name" UNIQUE("group_id","name")
);
--> statement-breakpoint
CREATE INDEX "idx_catalog_items_bu" ON "vritti_core"."catalog_items" ("business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_items_category" ON "vritti_core"."catalog_items" ("category_id");--> statement-breakpoint
CREATE INDEX "idx_item_images_item" ON "vritti_core"."item_images" ("item_id");--> statement-breakpoint
CREATE INDEX "idx_item_variants_item" ON "vritti_core"."item_variants" ("item_id");--> statement-breakpoint
CREATE INDEX "idx_modifier_groups_bu" ON "vritti_core"."modifier_groups" ("business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_modifier_options_group" ON "vritti_core"."modifier_options" ("group_id");