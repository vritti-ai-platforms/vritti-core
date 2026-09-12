ALTER TABLE "commerce"."catalog_listings" ADD COLUMN "site_id" uuid DEFAULT cast(nullif(current_setting('app.site_id', true), '') as uuid);--> statement-breakpoint
ALTER TABLE "commerce"."catalog_listings" ALTER COLUMN "legal_entity_id" SET DEFAULT cast(nullif(current_setting('app.le_id', true), '') as uuid);--> statement-breakpoint
ALTER TABLE "commerce"."catalog_listings" DROP CONSTRAINT "uq_catalog_listings";--> statement-breakpoint
ALTER TABLE "commerce"."catalog_listings" ADD CONSTRAINT "uq_catalog_listings" UNIQUE NULLS NOT DISTINCT("catalog_id","offering_variant_id","legal_entity_id","site_id","inventory_item_mrp_id");--> statement-breakpoint
ALTER TABLE "commerce"."catalog_listings" ADD CONSTRAINT "ck_catalog_listings_site_needs_le" CHECK ("site_id" is null or "legal_entity_id" is not null);--> statement-breakpoint
CREATE POLICY "catalog_listing_reach" ON "commerce"."catalog_listings" AS RESTRICTIVE FOR ALL TO public USING (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then (legal_entity_id is null and site_id is null)
      or (legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null)
      or (legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid))
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then (legal_entity_id is null and site_id is null)
      or (legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null)
    else legal_entity_id is null and site_id is null
  end, false)) WITH CHECK (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    else legal_entity_id is null and site_id is null
  end, false));