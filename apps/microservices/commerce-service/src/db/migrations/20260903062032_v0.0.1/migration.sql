ALTER TABLE "commerce"."offering_dimension_templates" ALTER COLUMN "legal_entity_id" SET DEFAULT (case when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then null else cast(nullif(current_setting('app.le_id', true), '') as uuid) end);--> statement-breakpoint
ALTER TABLE "commerce"."offering_dimension_templates" ALTER COLUMN "site_id" SET DEFAULT cast(nullif(current_setting('app.site_id', true), '') as uuid);--> statement-breakpoint
ALTER POLICY "reach_read" ON "commerce"."offering_dimension_templates" TO public USING (
        (legal_entity_id is null and site_id is null)
        or legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
        or site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid));--> statement-breakpoint
ALTER POLICY "owner_insert" ON "commerce"."offering_dimension_templates" TO public WITH CHECK (
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    else legal_entity_id is null and site_id is null
  end);--> statement-breakpoint
ALTER POLICY "owner_update" ON "commerce"."offering_dimension_templates" TO public USING (
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    else legal_entity_id is null and site_id is null
  end);--> statement-breakpoint
ALTER POLICY "owner_delete" ON "commerce"."offering_dimension_templates" TO public USING (
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    else legal_entity_id is null and site_id is null
  end);