ALTER TABLE "commerce"."catalogs" DROP CONSTRAINT "uq_catalogs_org_name";--> statement-breakpoint
ALTER TABLE "commerce"."catalogs" ADD COLUMN "legal_entity_id" uuid DEFAULT cast(nullif(current_setting('app.le_id', true), '') as uuid);--> statement-breakpoint
ALTER TABLE "commerce"."catalogs" ADD COLUMN "site_id" uuid DEFAULT cast(nullif(current_setting('app.site_id', true), '') as uuid);--> statement-breakpoint
ALTER TABLE "commerce"."catalogs" DROP COLUMN "owner_legal_entity_id";--> statement-breakpoint
ALTER TABLE "commerce"."catalogs" ADD CONSTRAINT "uq_catalogs_owner_name" UNIQUE NULLS NOT DISTINCT("organization_id","legal_entity_id","site_id","name");--> statement-breakpoint
ALTER TABLE "commerce"."catalogs" ADD CONSTRAINT "ck_catalogs_site_needs_le" CHECK ("site_id" is null or "legal_entity_id" is not null);--> statement-breakpoint
CREATE POLICY "catalog_reach" ON "commerce"."catalogs" AS RESTRICTIVE FOR SELECT TO public USING (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then (legal_entity_id is null and site_id is null)
      or (legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null)
      or (legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid))
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then (legal_entity_id is null and site_id is null)
      or (site_id = any(string_to_array(nullif(current_setting('app.site_ids', true), ''), ',')::uuid[]))
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then (legal_entity_id is null and site_id is null)
      or (legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null)
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then legal_entity_id is null and site_id is null
    else false
  end, false));--> statement-breakpoint
CREATE POLICY "catalog_reach_insert" ON "commerce"."catalogs" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then legal_entity_id is null and site_id is null
    else false
  end, false));--> statement-breakpoint
CREATE POLICY "catalog_reach_update" ON "commerce"."catalogs" AS RESTRICTIVE FOR UPDATE TO public USING (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then legal_entity_id is null and site_id is null
    else false
  end, false)) WITH CHECK (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then legal_entity_id is null and site_id is null
    else false
  end, false));--> statement-breakpoint
CREATE POLICY "catalog_reach_delete" ON "commerce"."catalogs" AS RESTRICTIVE FOR DELETE TO public USING (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then legal_entity_id is null and site_id is null
    else false
  end, false));