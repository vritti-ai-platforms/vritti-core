CREATE TABLE "commerce"."carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"legal_entity_id" uuid DEFAULT cast(nullif(current_setting('app.le_id', true), '') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(nullif(current_setting('app.site_id', true), '') as uuid),
	"party_id" uuid NOT NULL,
	"channel_id" uuid,
	"checkout_started_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_carts_party_workspace" UNIQUE NULLS NOT DISTINCT("organization_id","legal_entity_id","site_id","party_id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."carts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" DROP CONSTRAINT "cart_items_party_id_parties_id_fkey";--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" DROP CONSTRAINT "cart_items_catalog_listing_id_catalog_listings_id_fkey";--> statement-breakpoint
ALTER TABLE "commerce"."wishlist_items" DROP CONSTRAINT "favourites_catalog_listing_id_catalog_listings_id_fkey";--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" DROP CONSTRAINT "uq_cart_items_party_listing";--> statement-breakpoint
ALTER TABLE "commerce"."wishlist_items" DROP CONSTRAINT "uq_wishlist_items_party_listing";--> statement-breakpoint
DROP INDEX "commerce"."idx_cart_items_party";--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" ADD COLUMN "cart_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" ADD COLUMN "offering_variant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."wishlist_items" ADD COLUMN "offering_variant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" DROP COLUMN "app_id";--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" DROP COLUMN "party_id";--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" DROP COLUMN "catalog_listing_id";--> statement-breakpoint
ALTER TABLE "commerce"."wishlist_items" DROP COLUMN "catalog_listing_id";--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" ADD CONSTRAINT "uq_cart_items_cart_variant" UNIQUE("cart_id","offering_variant_id");--> statement-breakpoint
ALTER TABLE "commerce"."wishlist_items" ADD CONSTRAINT "uq_wishlist_items_party_variant" UNIQUE("organization_id","app_id","party_id","offering_variant_id");--> statement-breakpoint
CREATE INDEX "idx_carts_party" ON "commerce"."carts" ("organization_id","legal_entity_id","site_id","party_id");--> statement-breakpoint
CREATE INDEX "idx_carts_abandoned" ON "commerce"."carts" ("updated_at");--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "commerce"."carts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" ADD CONSTRAINT "cart_items_offering_variant_id_offering_variants_id_fkey" FOREIGN KEY ("offering_variant_id") REFERENCES "commerce"."offering_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."carts" ADD CONSTRAINT "carts_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "commerce"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."carts" ADD CONSTRAINT "carts_channel_id_catalog_channels_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "commerce"."catalog_channels"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "commerce"."wishlist_items" ADD CONSTRAINT "wishlist_items_offering_variant_id_offering_variants_id_fkey" FOREIGN KEY ("offering_variant_id") REFERENCES "commerce"."offering_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "reach_read" ON "commerce"."cart_items" AS RESTRICTIVE FOR SELECT TO public USING (exists (select 1 from commerce.carts o where o.id = cart_id));--> statement-breakpoint
CREATE POLICY "owner_insert" ON "commerce"."cart_items" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (exists (select 1 from commerce.carts o where o.id = cart_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then o.legal_entity_id is null and o.site_id is null
    else false
  end));--> statement-breakpoint
CREATE POLICY "owner_update" ON "commerce"."cart_items" AS RESTRICTIVE FOR UPDATE TO public USING (exists (select 1 from commerce.carts o where o.id = cart_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then o.legal_entity_id is null and o.site_id is null
    else false
  end));--> statement-breakpoint
CREATE POLICY "owner_delete" ON "commerce"."cart_items" AS RESTRICTIVE FOR DELETE TO public USING (exists (select 1 from commerce.carts o where o.id = cart_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then o.legal_entity_id is null and o.site_id is null
    else false
  end));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."carts" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "reach_read" ON "commerce"."carts" AS RESTRICTIVE FOR SELECT TO public USING (
  case
    -- a site: org-owned rows, its own LE's rows, its own rows
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then (legal_entity_id is null and site_id is null)
      or (site_id is null and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid))
      or (site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid))
    -- a site group: org-owned rows plus whatever its member sites own, and nothing else
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then (legal_entity_id is null and site_id is null)
      or (site_id = any(string_to_array(nullif(current_setting('app.site_ids', true), ''), ',')::uuid[]))
    -- an LE: org-owned rows, its own rows, and everything its sites own
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then (legal_entity_id is null and site_id is null)
      or (legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid))
    -- the org workspace: every row in the organization
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then true
    else false
  end);--> statement-breakpoint
CREATE POLICY "owner_insert" ON "commerce"."carts" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then legal_entity_id is null and site_id is null
    else false
  end);--> statement-breakpoint
CREATE POLICY "owner_update" ON "commerce"."carts" AS RESTRICTIVE FOR UPDATE TO public USING (
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then legal_entity_id is null and site_id is null
    else false
  end);--> statement-breakpoint
CREATE POLICY "owner_delete" ON "commerce"."carts" AS RESTRICTIVE FOR DELETE TO public USING (
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then legal_entity_id is null and site_id is null
    else false
  end);