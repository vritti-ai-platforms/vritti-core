CREATE TABLE "commerce"."offering_dimension_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"dimension_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"value" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_offering_dimension_values_dimension_code" UNIQUE("dimension_id","code"),
	CONSTRAINT "uq_offering_dimension_values_dimension_value" UNIQUE("dimension_id","value"),
	CONSTRAINT "offering_dimension_values_code_chk" CHECK ("code" ~ '^[a-z][a-z0-9-]*$')
);
--> statement-breakpoint
ALTER TABLE "commerce"."offering_dimension_values" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."offering_dimensions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"offering_id" uuid NOT NULL,
	"template_id" uuid,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_offering_dimensions_offering_code" UNIQUE("offering_id","code"),
	CONSTRAINT "uq_offering_dimensions_offering_name" UNIQUE("offering_id","name"),
	CONSTRAINT "offering_dimensions_code_chk" CHECK ("code" ~ '^[a-z][a-z0-9-]*$')
);
--> statement-breakpoint
ALTER TABLE "commerce"."offering_dimensions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."offering_bom" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"variant_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"quantity" numeric(12,3) DEFAULT '1' NOT NULL,
	"uom_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_offering_bom_variant_item_uom" UNIQUE("variant_id","inventory_item_id","uom_id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."offering_bom" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."offering_variant_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"variant_id" uuid NOT NULL,
	"dimension_id" uuid NOT NULL,
	"value_id" uuid NOT NULL,
	CONSTRAINT "uq_offering_variant_values_variant_dimension" UNIQUE("variant_id","dimension_id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."offering_variant_values" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY "site_read" ON "commerce"."offerings";--> statement-breakpoint
DROP POLICY "site_write" ON "commerce"."offerings";--> statement-breakpoint
DROP POLICY "site_update" ON "commerce"."offerings";--> statement-breakpoint
DROP POLICY "site_delete" ON "commerce"."offerings";--> statement-breakpoint
DROP POLICY "org_isolation" ON "commerce"."catalog_channels";--> statement-breakpoint
DROP POLICY "site_read" ON "commerce"."catalog_channels";--> statement-breakpoint
DROP POLICY "site_write" ON "commerce"."catalog_channels";--> statement-breakpoint
DROP POLICY "site_update" ON "commerce"."catalog_channels";--> statement-breakpoint
DROP POLICY "site_delete" ON "commerce"."catalog_channels";--> statement-breakpoint
DROP POLICY "org_isolation" ON "commerce"."catalogs";--> statement-breakpoint
DROP POLICY "site_read" ON "commerce"."catalogs";--> statement-breakpoint
DROP POLICY "site_write" ON "commerce"."catalogs";--> statement-breakpoint
DROP POLICY "site_update" ON "commerce"."catalogs";--> statement-breakpoint
DROP POLICY "site_delete" ON "commerce"."catalogs";--> statement-breakpoint
DROP POLICY "org_isolation" ON "commerce"."offering_variant_components";--> statement-breakpoint
DROP POLICY "org_isolation" ON "commerce"."variant_option_values";--> statement-breakpoint
DROP POLICY "org_isolation" ON "commerce"."variant_options";--> statement-breakpoint
ALTER TABLE "commerce"."catalog_channels" DROP CONSTRAINT "catalog_channels_catalog_id_catalogs_id_fkey";--> statement-breakpoint
ALTER TABLE "commerce"."modifier_groups" DROP CONSTRAINT "modifier_groups_catalog_id_catalogs_id_fkey";--> statement-breakpoint
ALTER TABLE "commerce"."offering_options" DROP CONSTRAINT "offering_options_variant_option_id_variant_options_id_fkey";--> statement-breakpoint
ALTER TABLE "commerce"."offering_variant_option_values" DROP CONSTRAINT "offering_variant_option_values_KYe3VBYNJOni_fkey";--> statement-breakpoint
ALTER TABLE "commerce"."offerings" DROP CONSTRAINT "offerings_catalog_id_catalogs_id_fkey";--> statement-breakpoint
ALTER TABLE "commerce"."pos_terminals" DROP CONSTRAINT "pos_terminals_catalog_id_catalogs_id_fkey";--> statement-breakpoint
ALTER TABLE "commerce"."variant_option_values" DROP CONSTRAINT "variant_option_values_variant_option_id_variant_options_id_fkey";--> statement-breakpoint
ALTER TABLE "commerce"."variant_options" DROP CONSTRAINT "variant_options_catalog_id_catalogs_id_fkey";--> statement-breakpoint
DROP TABLE "commerce"."catalog_channels";--> statement-breakpoint
DROP TABLE "commerce"."catalogs";--> statement-breakpoint
DROP TABLE "commerce"."offering_options";--> statement-breakpoint
DROP TABLE "commerce"."offering_variant_components";--> statement-breakpoint
DROP TABLE "commerce"."offering_variant_option_values";--> statement-breakpoint
DROP TABLE "commerce"."variant_option_values";--> statement-breakpoint
DROP TABLE "commerce"."variant_options";--> statement-breakpoint
ALTER TABLE "commerce"."offering_variants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "commerce"."modifier_groups" DROP CONSTRAINT "uq_modifier_groups_catalog_name";--> statement-breakpoint
ALTER TABLE "commerce"."offering_variants" DROP CONSTRAINT "uq_offering_variants_offering_sku";--> statement-breakpoint
DROP INDEX "commerce"."idx_offerings_catalog";--> statement-breakpoint
DROP INDEX "commerce"."idx_modifier_groups_catalog";--> statement-breakpoint
ALTER TABLE "commerce"."offering_dimension_template_values" ADD COLUMN "code" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."offering_variants" ADD COLUMN "external_sku" varchar(100);--> statement-breakpoint
ALTER TABLE "commerce"."offering_variants" ADD COLUMN "sales_uom_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."offering_variants" ADD COLUMN "is_active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."offerings" ADD COLUMN "legal_entity_id" uuid DEFAULT cast(nullif(current_setting('app.le_id', true), '') as uuid);--> statement-breakpoint
ALTER TABLE "commerce"."offerings" ADD COLUMN "code" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."offerings" ADD COLUMN "is_active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."offerings" ALTER COLUMN "fulfilment_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "commerce"."fulfilment_type";--> statement-breakpoint
CREATE TYPE "commerce"."fulfilment_type" AS ENUM('STOCK', 'ASSEMBLY', 'COMPOSITE', 'SERVICE');--> statement-breakpoint
ALTER TABLE "commerce"."offerings" ALTER COLUMN "fulfilment_type" SET DATA TYPE "commerce"."fulfilment_type" USING "fulfilment_type"::"commerce"."fulfilment_type";--> statement-breakpoint
ALTER TABLE "commerce"."offering_variants" DROP COLUMN "price";--> statement-breakpoint
ALTER TABLE "commerce"."offering_variants" DROP COLUMN "is_available";--> statement-breakpoint
ALTER TABLE "commerce"."offerings" DROP COLUMN "catalog_id";--> statement-breakpoint
ALTER TABLE "commerce"."offerings" DROP COLUMN "is_available";--> statement-breakpoint
ALTER TABLE "commerce"."modifier_groups" DROP COLUMN "catalog_id";--> statement-breakpoint
ALTER TABLE "commerce"."pos_terminals" DROP COLUMN "catalog_id";--> statement-breakpoint
ALTER TABLE "commerce"."offering_variants" ALTER COLUMN "sku" SET DATA TYPE varchar(200) USING "sku"::varchar(200);--> statement-breakpoint
ALTER TABLE "commerce"."offerings" ALTER COLUMN "site_id" SET DEFAULT cast(nullif(current_setting('app.site_id', true), '') as uuid);--> statement-breakpoint
ALTER TABLE "commerce"."offerings" ALTER COLUMN "site_id" DROP NOT NULL;--> statement-breakpoint
DROP INDEX "commerce"."idx_offering_variants_offering";--> statement-breakpoint
CREATE INDEX "idx_offering_variants_offering" ON "commerce"."offering_variants" ("offering_id","sort_order");--> statement-breakpoint
ALTER TABLE "commerce"."modifier_groups" ADD CONSTRAINT "uq_modifier_groups_site_name" UNIQUE("organization_id","site_id","name");--> statement-breakpoint
ALTER TABLE "commerce"."offering_dimension_template_values" ADD CONSTRAINT "uq_offering_dimension_template_values_template_code" UNIQUE("template_id","code");--> statement-breakpoint
ALTER TABLE "commerce"."offering_variants" ADD CONSTRAINT "uq_offering_variants_org_sku" UNIQUE("organization_id","sku");--> statement-breakpoint
ALTER TABLE "commerce"."offering_variants" ADD CONSTRAINT "uq_offering_variants_org_external_sku" UNIQUE("organization_id","external_sku");--> statement-breakpoint
ALTER TABLE "commerce"."offerings" ADD CONSTRAINT "uq_offerings_org_code" UNIQUE("organization_id","code");--> statement-breakpoint
ALTER TABLE "commerce"."offerings" ADD CONSTRAINT "uq_offerings_owner_name" UNIQUE NULLS NOT DISTINCT("organization_id","legal_entity_id","site_id","name");--> statement-breakpoint
CREATE INDEX "idx_offering_dimension_values_dimension" ON "commerce"."offering_dimension_values" ("dimension_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_offering_dimensions_offering" ON "commerce"."offering_dimensions" ("offering_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_offering_dimensions_template" ON "commerce"."offering_dimensions" ("template_id");--> statement-breakpoint
CREATE INDEX "idx_offering_bom_variant" ON "commerce"."offering_bom" ("variant_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_offering_bom_item" ON "commerce"."offering_bom" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_offering_variant_values_value" ON "commerce"."offering_variant_values" ("value_id");--> statement-breakpoint
CREATE INDEX "idx_offerings_org" ON "commerce"."offerings" ("organization_id","name");--> statement-breakpoint
CREATE INDEX "idx_offerings_le" ON "commerce"."offerings" ("organization_id","legal_entity_id");--> statement-breakpoint
ALTER TABLE "commerce"."offering_dimension_values" ADD CONSTRAINT "offering_dimension_values_oa1uhT1oZcsq_fkey" FOREIGN KEY ("dimension_id") REFERENCES "commerce"."offering_dimensions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."offering_dimensions" ADD CONSTRAINT "offering_dimensions_offering_id_offerings_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "commerce"."offerings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."offering_dimensions" ADD CONSTRAINT "offering_dimensions_NITGvLOyuk9l_fkey" FOREIGN KEY ("template_id") REFERENCES "commerce"."offering_dimension_templates"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "commerce"."offering_bom" ADD CONSTRAINT "offering_bom_variant_id_offering_variants_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "commerce"."offering_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."offering_bom" ADD CONSTRAINT "offering_bom_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "commerce"."inventory_items"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."offering_bom" ADD CONSTRAINT "offering_bom_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "commerce"."uom"("id");--> statement-breakpoint
ALTER TABLE "commerce"."offering_variant_values" ADD CONSTRAINT "offering_variant_values_variant_id_offering_variants_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "commerce"."offering_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."offering_variant_values" ADD CONSTRAINT "offering_variant_values_B8XGfRHQTL2B_fkey" FOREIGN KEY ("dimension_id") REFERENCES "commerce"."offering_dimensions"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."offering_variant_values" ADD CONSTRAINT "offering_variant_values_LAgGv6q1Xfy4_fkey" FOREIGN KEY ("value_id") REFERENCES "commerce"."offering_dimension_values"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."offering_variants" ADD CONSTRAINT "offering_variants_offering_id_offerings_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "commerce"."offerings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."offering_variants" ADD CONSTRAINT "offering_variants_sales_uom_id_uom_id_fkey" FOREIGN KEY ("sales_uom_id") REFERENCES "commerce"."uom"("id");--> statement-breakpoint
ALTER TABLE "commerce"."offering_dimension_template_values" ADD CONSTRAINT "offering_dimension_template_values_code_chk" CHECK ("code" ~ '^[a-z][a-z0-9-]*$');--> statement-breakpoint
ALTER TABLE "commerce"."offerings" ADD CONSTRAINT "offerings_code_chk" CHECK ("code" ~ '^[a-z][a-z0-9-]*$');--> statement-breakpoint
ALTER TABLE "commerce"."offerings" ADD CONSTRAINT "offerings_owner_chk" CHECK ("site_id" is null or "legal_entity_id" is not null);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."offering_dimension_values" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "offering_reach" ON "commerce"."offering_dimension_values" AS RESTRICTIVE FOR ALL TO public USING (exists (select 1 from commerce.offering_dimensions d where d.id = dimension_id));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."offering_dimensions" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "offering_reach" ON "commerce"."offering_dimensions" AS RESTRICTIVE FOR ALL TO public USING (exists (select 1 from commerce.offerings o where o.id = offering_id));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."offering_bom" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "offering_reach" ON "commerce"."offering_bom" AS RESTRICTIVE FOR ALL TO public USING (exists (select 1 from commerce.offering_variants v where v.id = variant_id));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."offering_variant_values" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "offering_reach" ON "commerce"."offering_variant_values" AS RESTRICTIVE FOR ALL TO public USING (exists (select 1 from commerce.offering_variants v where v.id = variant_id));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."offering_variants" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "offering_reach" ON "commerce"."offering_variants" AS RESTRICTIVE FOR ALL TO public USING (exists (select 1 from commerce.offerings o where o.id = offering_id));--> statement-breakpoint
CREATE POLICY "reach_read" ON "commerce"."offerings" AS RESTRICTIVE FOR SELECT TO public USING (
        -- upward: org-owned rows are visible from every workspace
        (legal_entity_id is null and site_id is null)
        -- downward: the org workspace sees every row in the organization
        or (cast(nullif(current_setting('app.le_id', true), '') as uuid) is null and cast(nullif(current_setting('app.site_id', true), '') as uuid) is null)
        -- upward: my legal entity's own rows, whether I am that LE or a site beneath it
        or (site_id is null and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid))
        -- downward: an LE workspace also sees the rows its sites own
        or (cast(nullif(current_setting('app.site_id', true), '') as uuid) is null and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid))
        -- my own site's rows (a sibling site's are never visible)
        or site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid));--> statement-breakpoint
CREATE POLICY "owner_insert" ON "commerce"."offerings" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    else legal_entity_id is null and site_id is null
  end);--> statement-breakpoint
CREATE POLICY "owner_update" ON "commerce"."offerings" AS RESTRICTIVE FOR UPDATE TO public USING (
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    else legal_entity_id is null and site_id is null
  end);--> statement-breakpoint
CREATE POLICY "owner_delete" ON "commerce"."offerings" AS RESTRICTIVE FOR DELETE TO public USING (
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    else legal_entity_id is null and site_id is null
  end);