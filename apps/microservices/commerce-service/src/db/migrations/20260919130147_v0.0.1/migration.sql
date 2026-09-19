CREATE POLICY "template_reach" ON "commerce"."dimension_template_values" AS RESTRICTIVE FOR SELECT TO public USING (exists (select 1 from "commerce"."dimension_templates" t where t.id = template_id));--> statement-breakpoint
CREATE POLICY "template_owner_insert" ON "commerce"."dimension_template_values" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (exists (
  select 1 from "commerce"."dimension_templates" t where t.id = template_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then t.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and t.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then t.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and t.site_id is null
    else t.legal_entity_id is null and t.site_id is null
  end, false)
));--> statement-breakpoint
CREATE POLICY "template_owner_update" ON "commerce"."dimension_template_values" AS RESTRICTIVE FOR UPDATE TO public USING (exists (
  select 1 from "commerce"."dimension_templates" t where t.id = template_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then t.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and t.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then t.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and t.site_id is null
    else t.legal_entity_id is null and t.site_id is null
  end, false)
));--> statement-breakpoint
CREATE POLICY "template_owner_delete" ON "commerce"."dimension_template_values" AS RESTRICTIVE FOR DELETE TO public USING (exists (
  select 1 from "commerce"."dimension_templates" t where t.id = template_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then t.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and t.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then t.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and t.site_id is null
    else t.legal_entity_id is null and t.site_id is null
  end, false)
));