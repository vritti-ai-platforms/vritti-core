CREATE TABLE "commerce"."catalog_item_channel_exclusions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"catalog_item_id" uuid NOT NULL,
	"sales_channel_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_catalog_item_channel_exclusions" UNIQUE("catalog_item_id","sales_channel_id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."catalog_item_channel_exclusions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."catalog_item_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"catalog_item_id" uuid NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"amount" bigint NOT NULL,
	"site_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_catalog_item_prices_scope" UNIQUE NULLS NOT DISTINCT("catalog_item_id","currency_code","site_id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."catalog_item_prices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."catalog_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"catalog_id" uuid NOT NULL,
	"offering_variant_id" uuid NOT NULL,
	"legal_entity_id" uuid,
	"inventory_item_mrp_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_catalog_items_listing" UNIQUE NULLS NOT DISTINCT("catalog_id","offering_variant_id","legal_entity_id","inventory_item_mrp_id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."catalog_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."catalog_sales_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"catalog_id" uuid NOT NULL,
	"sales_channel_id" uuid NOT NULL,
	"legal_entity_id" uuid NOT NULL,
	"site_id" uuid,
	"mrp_selectable" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_catalog_sales_channels_mapping" UNIQUE NULLS NOT DISTINCT("catalog_id","sales_channel_id","legal_entity_id","site_id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."catalog_sales_channels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."catalogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner_legal_entity_id" uuid,
	"tax_inclusive" boolean DEFAULT false NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_catalogs_org_name" UNIQUE("organization_id","name")
);
--> statement-breakpoint
ALTER TABLE "commerce"."catalogs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_catalog_item_channel_exclusions_item" ON "commerce"."catalog_item_channel_exclusions" ("catalog_item_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_item_prices_item" ON "commerce"."catalog_item_prices" ("catalog_item_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_items_catalog" ON "commerce"."catalog_items" ("catalog_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_items_variant" ON "commerce"."catalog_items" ("offering_variant_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_items_mrp" ON "commerce"."catalog_items" ("inventory_item_mrp_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_sales_channels_catalog" ON "commerce"."catalog_sales_channels" ("catalog_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_sales_channels_lookup" ON "commerce"."catalog_sales_channels" ("sales_channel_id","legal_entity_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_catalogs_org" ON "commerce"."catalogs" ("organization_id","name");--> statement-breakpoint
ALTER TABLE "commerce"."catalog_item_channel_exclusions" ADD CONSTRAINT "catalog_item_channel_exclusions_Faha7PuwT4iG_fkey" FOREIGN KEY ("catalog_item_id") REFERENCES "commerce"."catalog_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."catalog_item_channel_exclusions" ADD CONSTRAINT "catalog_item_channel_exclusions_ZypHIgR0FTnO_fkey" FOREIGN KEY ("sales_channel_id") REFERENCES "commerce"."sales_channels"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."catalog_item_prices" ADD CONSTRAINT "catalog_item_prices_catalog_item_id_catalog_items_id_fkey" FOREIGN KEY ("catalog_item_id") REFERENCES "commerce"."catalog_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."catalog_items" ADD CONSTRAINT "catalog_items_catalog_id_catalogs_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "commerce"."catalogs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."catalog_items" ADD CONSTRAINT "catalog_items_offering_variant_id_offering_variants_id_fkey" FOREIGN KEY ("offering_variant_id") REFERENCES "commerce"."offering_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."catalog_items" ADD CONSTRAINT "catalog_items_inventory_item_mrp_id_inventory_item_mrps_id_fkey" FOREIGN KEY ("inventory_item_mrp_id") REFERENCES "commerce"."inventory_item_mrps"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."catalog_sales_channels" ADD CONSTRAINT "catalog_sales_channels_catalog_id_catalogs_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "commerce"."catalogs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."catalog_sales_channels" ADD CONSTRAINT "catalog_sales_channels_sales_channel_id_sales_channels_id_fkey" FOREIGN KEY ("sales_channel_id") REFERENCES "commerce"."sales_channels"("id") ON DELETE RESTRICT;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."catalog_item_channel_exclusions" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."catalog_item_prices" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."catalog_items" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."catalog_sales_channels" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."catalogs" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));