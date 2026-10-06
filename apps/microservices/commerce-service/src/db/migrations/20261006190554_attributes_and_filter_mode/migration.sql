CREATE TYPE "commerce"."catalog_filter_mode" AS ENUM('STATIC', 'NARROWING');--> statement-breakpoint
CREATE TABLE "commerce"."attribute_template_values" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"template_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"value" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_attribute_template_values_template_value" UNIQUE("template_id","value"),
	CONSTRAINT "uq_attribute_template_values_template_code" UNIQUE("template_id","code"),
	CONSTRAINT "attribute_template_values_code_chk" CHECK ("code" ~ '^[a-z0-9][a-z0-9-]*$')
);
--> statement-breakpoint
ALTER TABLE "commerce"."attribute_template_values" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."attribute_templates" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"legal_entity_id" uuid DEFAULT cast(nullif(current_setting('app.le_id', true), '') as uuid),
	"site_id" uuid DEFAULT cast(nullif(current_setting('app.site_id', true), '') as uuid),
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(500),
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_attribute_templates_org_code" UNIQUE("organization_id","code"),
	CONSTRAINT "uq_attribute_templates_owner_name" UNIQUE NULLS NOT DISTINCT("organization_id","legal_entity_id","site_id","name"),
	CONSTRAINT "attribute_templates_code_chk" CHECK ("code" ~ '^[a-z0-9][a-z0-9-]*$'),
	CONSTRAINT "attribute_templates_owner_chk" CHECK ("site_id" is null or "legal_entity_id" is not null)
);
--> statement-breakpoint
ALTER TABLE "commerce"."attribute_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."offering_attribute_values" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"attribute_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"value" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_offering_attribute_values_attribute_code" UNIQUE("attribute_id","code"),
	CONSTRAINT "uq_offering_attribute_values_attribute_value" UNIQUE("attribute_id","value"),
	CONSTRAINT "offering_attribute_values_code_chk" CHECK ("code" ~ '^[a-z0-9][a-z0-9-]*$')
);
--> statement-breakpoint
ALTER TABLE "commerce"."offering_attribute_values" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."offering_attributes" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"offering_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(500),
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_offering_attributes_offering_code" UNIQUE("offering_id","code"),
	CONSTRAINT "uq_offering_attributes_offering_name" UNIQUE("offering_id","name"),
	CONSTRAINT "offering_attributes_code_chk" CHECK ("code" ~ '^[a-z0-9][a-z0-9-]*$')
);
--> statement-breakpoint
ALTER TABLE "commerce"."offering_attributes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."offering_variant_attribute_values" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"variant_id" uuid NOT NULL,
	"attribute_id" uuid NOT NULL,
	"value_id" uuid NOT NULL,
	CONSTRAINT "uq_offering_variant_attribute_values_variant_value" UNIQUE("variant_id","value_id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."offering_variant_attribute_values" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "commerce"."catalogs" ADD COLUMN "filter_mode" "commerce"."catalog_filter_mode" DEFAULT 'STATIC'::"commerce"."catalog_filter_mode" NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."offering_variants" DROP COLUMN "attributes";--> statement-breakpoint
CREATE INDEX "idx_attribute_template_values_template" ON "commerce"."attribute_template_values" ("template_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_attribute_templates_org" ON "commerce"."attribute_templates" ("organization_id","name");--> statement-breakpoint
CREATE INDEX "idx_attribute_templates_le" ON "commerce"."attribute_templates" ("organization_id","legal_entity_id");--> statement-breakpoint
CREATE INDEX "idx_attribute_templates_site" ON "commerce"."attribute_templates" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_offering_attribute_values_attribute" ON "commerce"."offering_attribute_values" ("attribute_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_offering_attributes_offering" ON "commerce"."offering_attributes" ("offering_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_offering_variant_attribute_values_value" ON "commerce"."offering_variant_attribute_values" ("value_id");--> statement-breakpoint
CREATE INDEX "idx_offering_variant_attribute_values_attribute" ON "commerce"."offering_variant_attribute_values" ("attribute_id");--> statement-breakpoint
ALTER TABLE "commerce"."attribute_template_values" ADD CONSTRAINT "attribute_template_values_2Xa35izpHiaU_fkey" FOREIGN KEY ("template_id") REFERENCES "commerce"."attribute_templates"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."offering_attribute_values" ADD CONSTRAINT "offering_attribute_values_kCFzWyvjWtb6_fkey" FOREIGN KEY ("attribute_id") REFERENCES "commerce"."offering_attributes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."offering_attributes" ADD CONSTRAINT "offering_attributes_offering_id_offerings_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "commerce"."offerings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."offering_variant_attribute_values" ADD CONSTRAINT "offering_variant_attribute_values_KMpdjwhg8bzM_fkey" FOREIGN KEY ("variant_id") REFERENCES "commerce"."offering_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."offering_variant_attribute_values" ADD CONSTRAINT "offering_variant_attribute_values_4nl8mxHLau68_fkey" FOREIGN KEY ("attribute_id") REFERENCES "commerce"."offering_attributes"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."offering_variant_attribute_values" ADD CONSTRAINT "offering_variant_attribute_values_d1iHPWC2oXoV_fkey" FOREIGN KEY ("value_id") REFERENCES "commerce"."offering_attribute_values"("id") ON DELETE RESTRICT;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."attribute_template_values" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "reach_read" ON "commerce"."attribute_template_values" AS RESTRICTIVE FOR SELECT TO public USING (exists (select 1 from commerce.attribute_templates o where o.id = template_id));--> statement-breakpoint
CREATE POLICY "owner_insert" ON "commerce"."attribute_template_values" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (exists (select 1 from commerce.attribute_templates o where o.id = template_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then o.legal_entity_id is null and o.site_id is null
    else false
  end));--> statement-breakpoint
CREATE POLICY "owner_update" ON "commerce"."attribute_template_values" AS RESTRICTIVE FOR UPDATE TO public USING (exists (select 1 from commerce.attribute_templates o where o.id = template_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then o.legal_entity_id is null and o.site_id is null
    else false
  end));--> statement-breakpoint
CREATE POLICY "owner_delete" ON "commerce"."attribute_template_values" AS RESTRICTIVE FOR DELETE TO public USING (exists (select 1 from commerce.attribute_templates o where o.id = template_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then o.legal_entity_id is null and o.site_id is null
    else false
  end));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."attribute_templates" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "reach_read" ON "commerce"."attribute_templates" AS RESTRICTIVE FOR SELECT TO public USING (
  case
    -- a site: org-owned rows, its own LE's rows, its own rows
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then (legal_entity_id is null and site_id is null)
      or (site_id is null and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid))
      or (site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid))
    -- a site group: org-owned rows plus whatever its member sites own, and nothing else
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then (legal_entity_id is null and site_id is null)
      or (site_id = any(string_to_array(nullif(current_setting('app.site_ids', true), ''), ',')::uuid[]))
    -- an LE: org-owned rows, its own rows, and everything its sites own
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then (legal_entity_id is null and site_id is null)
      or (legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid))
    -- the org workspace: every row in the organization
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then true
    else false
  end);--> statement-breakpoint
CREATE POLICY "owner_insert" ON "commerce"."attribute_templates" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then legal_entity_id is null and site_id is null
    else false
  end);--> statement-breakpoint
CREATE POLICY "owner_update" ON "commerce"."attribute_templates" AS RESTRICTIVE FOR UPDATE TO public USING (
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then legal_entity_id is null and site_id is null
    else false
  end);--> statement-breakpoint
CREATE POLICY "owner_delete" ON "commerce"."attribute_templates" AS RESTRICTIVE FOR DELETE TO public USING (
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then legal_entity_id is null and site_id is null
    else false
  end);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."offering_attribute_values" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "reach_read" ON "commerce"."offering_attribute_values" AS RESTRICTIVE FOR SELECT TO public USING (exists (select 1 from commerce.offering_attributes p where p.id = attribute_id));--> statement-breakpoint
CREATE POLICY "owner_insert" ON "commerce"."offering_attribute_values" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (exists (select 1 from commerce.offering_attributes p join commerce.offerings o on o.id = p.offering_id where p.id = attribute_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then o.legal_entity_id is null and o.site_id is null
    else false
  end));--> statement-breakpoint
CREATE POLICY "owner_update" ON "commerce"."offering_attribute_values" AS RESTRICTIVE FOR UPDATE TO public USING (exists (select 1 from commerce.offering_attributes p join commerce.offerings o on o.id = p.offering_id where p.id = attribute_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then o.legal_entity_id is null and o.site_id is null
    else false
  end));--> statement-breakpoint
CREATE POLICY "owner_delete" ON "commerce"."offering_attribute_values" AS RESTRICTIVE FOR DELETE TO public USING (exists (select 1 from commerce.offering_attributes p join commerce.offerings o on o.id = p.offering_id where p.id = attribute_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then o.legal_entity_id is null and o.site_id is null
    else false
  end));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."offering_attributes" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "reach_read" ON "commerce"."offering_attributes" AS RESTRICTIVE FOR SELECT TO public USING (exists (select 1 from commerce.offerings o where o.id = offering_id));--> statement-breakpoint
CREATE POLICY "owner_insert" ON "commerce"."offering_attributes" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (exists (select 1 from commerce.offerings o where o.id = offering_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then o.legal_entity_id is null and o.site_id is null
    else false
  end));--> statement-breakpoint
CREATE POLICY "owner_update" ON "commerce"."offering_attributes" AS RESTRICTIVE FOR UPDATE TO public USING (exists (select 1 from commerce.offerings o where o.id = offering_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then o.legal_entity_id is null and o.site_id is null
    else false
  end));--> statement-breakpoint
CREATE POLICY "owner_delete" ON "commerce"."offering_attributes" AS RESTRICTIVE FOR DELETE TO public USING (exists (select 1 from commerce.offerings o where o.id = offering_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then o.legal_entity_id is null and o.site_id is null
    else false
  end));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."offering_variant_attribute_values" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "reach_read" ON "commerce"."offering_variant_attribute_values" AS RESTRICTIVE FOR SELECT TO public USING (exists (select 1 from commerce.offering_variants p where p.id = variant_id));--> statement-breakpoint
CREATE POLICY "owner_insert" ON "commerce"."offering_variant_attribute_values" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (exists (select 1 from commerce.offering_variants p join commerce.offerings o on o.id = p.offering_id where p.id = variant_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then o.legal_entity_id is null and o.site_id is null
    else false
  end));--> statement-breakpoint
CREATE POLICY "owner_update" ON "commerce"."offering_variant_attribute_values" AS RESTRICTIVE FOR UPDATE TO public USING (exists (select 1 from commerce.offering_variants p join commerce.offerings o on o.id = p.offering_id where p.id = variant_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then o.legal_entity_id is null and o.site_id is null
    else false
  end));--> statement-breakpoint
CREATE POLICY "owner_delete" ON "commerce"."offering_variant_attribute_values" AS RESTRICTIVE FOR DELETE TO public USING (exists (select 1 from commerce.offering_variants p join commerce.offerings o on o.id = p.offering_id where p.id = variant_id and 
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is null
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then o.legal_entity_id is null and o.site_id is null
    else false
  end));