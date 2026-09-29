DROP POLICY "reach_read" ON "commerce"."carts";--> statement-breakpoint
DROP POLICY "owner_insert" ON "commerce"."carts";--> statement-breakpoint
DROP POLICY "owner_update" ON "commerce"."carts";--> statement-breakpoint
DROP POLICY "owner_delete" ON "commerce"."carts";--> statement-breakpoint
CREATE POLICY "cart_reach" ON "commerce"."carts" AS RESTRICTIVE FOR SELECT TO public USING (coalesce(
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
CREATE POLICY "cart_reach_insert" ON "commerce"."carts" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then legal_entity_id is null and site_id is null
    else false
  end, false));--> statement-breakpoint
CREATE POLICY "cart_reach_update" ON "commerce"."carts" AS RESTRICTIVE FOR UPDATE TO public USING (coalesce(
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
CREATE POLICY "cart_reach_delete" ON "commerce"."carts" AS RESTRICTIVE FOR DELETE TO public USING (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then legal_entity_id is null and site_id is null
    else false
  end, false));