ALTER TABLE "commerce"."catalog_channels" ALTER COLUMN "legal_entity_id" SET DEFAULT cast(nullif(current_setting('app.le_id', true), '') as uuid);--> statement-breakpoint
ALTER TABLE "commerce"."catalog_channels" ALTER COLUMN "site_id" SET DEFAULT cast(nullif(current_setting('app.site_id', true), '') as uuid);--> statement-breakpoint
CREATE POLICY "catalog_channel_reach" ON "commerce"."catalog_channels" AS RESTRICTIVE FOR ALL TO public USING (coalesce(
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