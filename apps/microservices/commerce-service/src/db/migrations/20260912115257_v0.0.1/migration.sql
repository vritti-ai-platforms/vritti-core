CREATE TABLE "commerce"."catalog_listing_channel_exclusions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"catalog_listing_id" uuid NOT NULL,
	"sales_channel_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_catalog_listing_channel_exclusions" UNIQUE("catalog_listing_id","sales_channel_id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."catalog_listing_channel_exclusions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."catalog_listing_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"catalog_listing_id" uuid NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"amount" bigint NOT NULL,
	"site_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_catalog_listing_prices_scope" UNIQUE NULLS NOT DISTINCT("catalog_listing_id","currency_code","site_id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."catalog_listing_prices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."catalog_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"catalog_id" uuid NOT NULL,
	"offering_variant_id" uuid NOT NULL,
	"legal_entity_id" uuid,
	"inventory_item_mrp_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_catalog_listings" UNIQUE NULLS NOT DISTINCT("catalog_id","offering_variant_id","legal_entity_id","inventory_item_mrp_id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."catalog_listings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY "org_isolation" ON "commerce"."catalog_item_channel_exclusions";--> statement-breakpoint
DROP POLICY "org_isolation" ON "commerce"."catalog_item_prices";--> statement-breakpoint
DROP POLICY "org_isolation" ON "commerce"."catalog_items";--> statement-breakpoint
ALTER TABLE "commerce"."catalog_item_channel_exclusions" DROP CONSTRAINT "catalog_item_channel_exclusions_Faha7PuwT4iG_fkey";--> statement-breakpoint
ALTER TABLE "commerce"."catalog_item_prices" DROP CONSTRAINT "catalog_item_prices_catalog_item_id_catalog_items_id_fkey";--> statement-breakpoint
DROP TABLE "commerce"."catalog_item_channel_exclusions";--> statement-breakpoint
DROP TABLE "commerce"."catalog_item_prices";--> statement-breakpoint
DROP TABLE "commerce"."catalog_items";--> statement-breakpoint
CREATE INDEX "idx_catalog_listing_channel_exclusions_listing" ON "commerce"."catalog_listing_channel_exclusions" ("catalog_listing_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_listing_prices_listing" ON "commerce"."catalog_listing_prices" ("catalog_listing_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_listings_catalog" ON "commerce"."catalog_listings" ("catalog_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_listings_variant" ON "commerce"."catalog_listings" ("offering_variant_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_listings_mrp" ON "commerce"."catalog_listings" ("inventory_item_mrp_id");--> statement-breakpoint
ALTER TABLE "commerce"."catalog_listing_channel_exclusions" ADD CONSTRAINT "catalog_listing_channel_exclusions_2n0JvlQkoTGv_fkey" FOREIGN KEY ("catalog_listing_id") REFERENCES "commerce"."catalog_listings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."catalog_listing_channel_exclusions" ADD CONSTRAINT "catalog_listing_channel_exclusions_hrGp7SHYU4A7_fkey" FOREIGN KEY ("sales_channel_id") REFERENCES "commerce"."sales_channels"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."catalog_listing_prices" ADD CONSTRAINT "catalog_listing_prices_emwaAwei2Km8_fkey" FOREIGN KEY ("catalog_listing_id") REFERENCES "commerce"."catalog_listings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."catalog_listings" ADD CONSTRAINT "catalog_listings_catalog_id_catalogs_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "commerce"."catalogs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."catalog_listings" ADD CONSTRAINT "catalog_listings_offering_variant_id_offering_variants_id_fkey" FOREIGN KEY ("offering_variant_id") REFERENCES "commerce"."offering_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."catalog_listings" ADD CONSTRAINT "catalog_listings_LU4oACJfLXku_fkey" FOREIGN KEY ("inventory_item_mrp_id") REFERENCES "commerce"."inventory_item_mrps"("id") ON DELETE RESTRICT;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."catalog_listing_channel_exclusions" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."catalog_listing_prices" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."catalog_listings" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));