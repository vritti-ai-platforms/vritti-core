CREATE TYPE "commerce"."purchase_quotation_change_type" AS ENUM('ENABLED', 'DISABLED', 'MINIMUM_CHANGED');--> statement-breakpoint
CREATE TABLE "commerce"."purchase_quotation_changes" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"purchase_id" uuid NOT NULL,
	"type" "commerce"."purchase_quotation_change_type" NOT NULL,
	"from_min_quotations" smallint,
	"to_min_quotations" smallint,
	"reason" text,
	"changed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commerce"."purchase_quotation_changes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_purchase_quotation_changes_purchase" ON "commerce"."purchase_quotation_changes" ("purchase_id");--> statement-breakpoint
ALTER TABLE "commerce"."purchase_quotation_changes" ADD CONSTRAINT "purchase_quotation_changes_purchase_id_purchases_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "commerce"."purchases"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."purchase_quotation_changes" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "reach_read" ON "commerce"."purchase_quotation_changes" AS RESTRICTIVE FOR SELECT TO public USING (exists (select 1 from commerce.purchases o where o.id = purchase_id));--> statement-breakpoint
CREATE POLICY "owner_insert" ON "commerce"."purchase_quotation_changes" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (exists (select 1 from commerce.purchases o where o.id = purchase_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)));--> statement-breakpoint
CREATE POLICY "owner_update" ON "commerce"."purchase_quotation_changes" AS RESTRICTIVE FOR UPDATE TO public USING (exists (select 1 from commerce.purchases o where o.id = purchase_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)));--> statement-breakpoint
CREATE POLICY "owner_delete" ON "commerce"."purchase_quotation_changes" AS RESTRICTIVE FOR DELETE TO public USING (exists (select 1 from commerce.purchases o where o.id = purchase_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)));