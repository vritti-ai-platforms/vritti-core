CREATE TYPE "commerce"."cart_status" AS ENUM('OPEN', 'CHECKED_OUT', 'ABANDONED');--> statement-breakpoint
CREATE TABLE "commerce"."cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"cart_id" uuid NOT NULL,
	"catalog_listing_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_cart_items_cart_listing" UNIQUE("cart_id","catalog_listing_id"),
	CONSTRAINT "ck_cart_items_quantity" CHECK ("quantity" > 0 and "quantity" <= 99)
);
--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"app_id" uuid NOT NULL,
	"party_id" uuid NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"status" "commerce"."cart_status" DEFAULT 'OPEN'::"commerce"."cart_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commerce"."carts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."favourites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"app_id" uuid NOT NULL,
	"party_id" uuid NOT NULL,
	"catalog_listing_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_favourites_party_listing" UNIQUE("organization_id","app_id","party_id","catalog_listing_id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."favourites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_cart_items_cart" ON "commerce"."cart_items" ("cart_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_carts_open_per_party" ON "commerce"."carts" ("organization_id","app_id","party_id") WHERE status = 'OPEN';--> statement-breakpoint
CREATE INDEX "idx_carts_party" ON "commerce"."carts" ("organization_id","app_id","party_id");--> statement-breakpoint
CREATE INDEX "idx_favourites_party" ON "commerce"."favourites" ("organization_id","app_id","party_id","created_at");--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "commerce"."carts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" ADD CONSTRAINT "cart_items_catalog_listing_id_catalog_listings_id_fkey" FOREIGN KEY ("catalog_listing_id") REFERENCES "commerce"."catalog_listings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."carts" ADD CONSTRAINT "carts_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "commerce"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."favourites" ADD CONSTRAINT "favourites_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "commerce"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."favourites" ADD CONSTRAINT "favourites_catalog_listing_id_catalog_listings_id_fkey" FOREIGN KEY ("catalog_listing_id") REFERENCES "commerce"."catalog_listings"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."cart_items" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "cart_reach" ON "commerce"."cart_items" AS RESTRICTIVE FOR ALL TO public USING (exists (select 1 from commerce.carts c where c.id = cart_id));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."carts" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."favourites" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));