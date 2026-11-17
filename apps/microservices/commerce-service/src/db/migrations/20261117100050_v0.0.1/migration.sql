ALTER TYPE "commerce"."supplier_price_source" ADD VALUE 'PURCHASE_ORDER';--> statement-breakpoint
CREATE TABLE "commerce"."site_purchasing_settings" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"legal_entity_id" uuid DEFAULT cast(nullif(current_setting('app.le_id', true), '') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(nullif(current_setting('app.site_id', true), '') as uuid) NOT NULL CONSTRAINT "uq_site_purchasing_settings_site" UNIQUE,
	"supplier_items_required" boolean DEFAULT false NOT NULL,
	"update_supplier_items_from_orders" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commerce"."site_purchasing_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_sites" ADD COLUMN "supplier_items_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."site_purchasing_settings" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "reach_read" ON "commerce"."site_purchasing_settings" AS RESTRICTIVE FOR SELECT TO public USING (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then site_id = any(string_to_array(nullif(current_setting('app.site_ids', true), ''), ',')::uuid[])
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then true
    else false
  end, false));--> statement-breakpoint
CREATE POLICY "owner_insert" ON "commerce"."site_purchasing_settings" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false));--> statement-breakpoint
CREATE POLICY "owner_update" ON "commerce"."site_purchasing_settings" AS RESTRICTIVE FOR UPDATE TO public USING (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)) WITH CHECK (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false));--> statement-breakpoint
CREATE POLICY "owner_delete" ON "commerce"."site_purchasing_settings" AS RESTRICTIVE FOR DELETE TO public USING (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false));--> statement-breakpoint
ALTER POLICY "owner_insert" ON "commerce"."supplier_items" TO public WITH CHECK ((exists (select 1 from commerce.suppliers o where o.id = supplier_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    else false
  end)) or (coalesce(cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null and exists (select 1 from commerce.supplier_enrollments l
    where l.supplier_id = supplier_items.supplier_id and l.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and l.is_active), false)));