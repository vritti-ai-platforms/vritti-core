CREATE TABLE "commerce"."cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"app_id" uuid NOT NULL,
	"party_id" uuid NOT NULL,
	"catalog_listing_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_cart_items_party_listing" UNIQUE("organization_id","app_id","party_id","catalog_listing_id"),
	CONSTRAINT "ck_cart_items_quantity" CHECK ("quantity" > 0 and "quantity" <= 99)
);
--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_cart_items_party" ON "commerce"."cart_items" ("organization_id","app_id","party_id","created_at");--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" ADD CONSTRAINT "cart_items_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "commerce"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" ADD CONSTRAINT "cart_items_catalog_listing_id_catalog_listings_id_fkey" FOREIGN KEY ("catalog_listing_id") REFERENCES "commerce"."catalog_listings"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."cart_items" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));