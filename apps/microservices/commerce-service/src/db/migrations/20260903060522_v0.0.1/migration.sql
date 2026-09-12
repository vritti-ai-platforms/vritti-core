CREATE TABLE "commerce"."offering_dimension_template_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"template_id" uuid NOT NULL,
	"value" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_offering_dimension_template_values_template_value" UNIQUE("template_id","value")
);
--> statement-breakpoint
ALTER TABLE "commerce"."offering_dimension_template_values" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."offering_dimension_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"legal_entity_id" uuid,
	"site_id" uuid,
	"name" varchar(100) NOT NULL,
	"description" varchar(500),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_offering_dimension_templates_owner_name" UNIQUE NULLS NOT DISTINCT("organization_id","legal_entity_id","site_id","name"),
	CONSTRAINT "offering_dimension_templates_owner_chk" CHECK (num_nonnulls("legal_entity_id", "site_id") <= 1)
);
--> statement-breakpoint
ALTER TABLE "commerce"."offering_dimension_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_offering_dimension_template_values_template" ON "commerce"."offering_dimension_template_values" ("template_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_offering_dimension_templates_org" ON "commerce"."offering_dimension_templates" ("organization_id","name");--> statement-breakpoint
CREATE INDEX "idx_offering_dimension_templates_le" ON "commerce"."offering_dimension_templates" ("organization_id","legal_entity_id");--> statement-breakpoint
CREATE INDEX "idx_offering_dimension_templates_site" ON "commerce"."offering_dimension_templates" ("organization_id","site_id");--> statement-breakpoint
ALTER TABLE "commerce"."offering_dimension_template_values" ADD CONSTRAINT "offering_dimension_template_values_UgIfXIhZu0DU_fkey" FOREIGN KEY ("template_id") REFERENCES "commerce"."offering_dimension_templates"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."offering_dimension_template_values" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."offering_dimension_templates" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "reach_read" ON "commerce"."offering_dimension_templates" AS RESTRICTIVE FOR SELECT TO public USING (
        (legal_entity_id is null and site_id is null)
        or legal_entity_id = (select current_setting('app.le_id', true)::uuid)
        or site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "owner_insert" ON "commerce"."offering_dimension_templates" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (
        case
          when (select current_setting('app.site_id', true)) is not null
            then site_id = (select current_setting('app.site_id', true)::uuid)
          when (select current_setting('app.le_id', true)) is not null
            then legal_entity_id = (select current_setting('app.le_id', true)::uuid) and site_id is null
          else legal_entity_id is null and site_id is null
        end);--> statement-breakpoint
CREATE POLICY "owner_update" ON "commerce"."offering_dimension_templates" AS RESTRICTIVE FOR UPDATE TO public USING (
        case
          when (select current_setting('app.site_id', true)) is not null
            then site_id = (select current_setting('app.site_id', true)::uuid)
          when (select current_setting('app.le_id', true)) is not null
            then legal_entity_id = (select current_setting('app.le_id', true)::uuid) and site_id is null
          else legal_entity_id is null and site_id is null
        end);--> statement-breakpoint
CREATE POLICY "owner_delete" ON "commerce"."offering_dimension_templates" AS RESTRICTIVE FOR DELETE TO public USING (
        case
          when (select current_setting('app.site_id', true)) is not null
            then site_id = (select current_setting('app.site_id', true)::uuid)
          when (select current_setting('app.le_id', true)) is not null
            then legal_entity_id = (select current_setting('app.le_id', true)::uuid) and site_id is null
          else legal_entity_id is null and site_id is null
        end);