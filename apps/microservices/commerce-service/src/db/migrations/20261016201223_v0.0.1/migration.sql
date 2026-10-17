CREATE TABLE "commerce"."catalog_currencies" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"catalog_id" uuid NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_catalog_currencies" UNIQUE("catalog_id","currency_code")
);
--> statement-breakpoint
ALTER TABLE "commerce"."catalog_currencies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_catalog_currencies_catalog" ON "commerce"."catalog_currencies" ("catalog_id","sort_order");--> statement-breakpoint
ALTER TABLE "commerce"."catalog_currencies" ADD CONSTRAINT "catalog_currencies_catalog_id_catalogs_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "commerce"."catalogs"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."catalog_currencies" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "reach_read" ON "commerce"."catalog_currencies" AS RESTRICTIVE FOR SELECT TO public USING (exists (select 1 from commerce.catalogs o where o.id = catalog_id));--> statement-breakpoint
CREATE POLICY "owner_insert" ON "commerce"."catalog_currencies" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (exists (select 1 from commerce.catalogs o where o.id = catalog_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then o.legal_entity_id is null and o.site_id is null
    else false
  end));--> statement-breakpoint
CREATE POLICY "owner_update" ON "commerce"."catalog_currencies" AS RESTRICTIVE FOR UPDATE TO public USING (exists (select 1 from commerce.catalogs o where o.id = catalog_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then o.legal_entity_id is null and o.site_id is null
    else false
  end));--> statement-breakpoint
CREATE POLICY "owner_delete" ON "commerce"."catalog_currencies" AS RESTRICTIVE FOR DELETE TO public USING (exists (select 1 from commerce.catalogs o where o.id = catalog_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then o.legal_entity_id is null and o.site_id is null
    else false
  end));