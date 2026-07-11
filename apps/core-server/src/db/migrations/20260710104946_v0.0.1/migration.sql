CREATE TYPE "vritti_core"."tax_regime" AS ENUM('GST', 'VAT', 'SALES_TAX', 'NONE');--> statement-breakpoint
CREATE TABLE "vritti_core"."legal_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"country" char(2) NOT NULL,
	"currency_code" char(3) NOT NULL,
	"tax_regime" "vritti_core"."tax_regime" NOT NULL,
	"tax_id" varchar(50),
	"fiscal_year_start" integer DEFAULT 4 NOT NULL,
	"parent_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."legal_entities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."le_tax_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"legal_entity_id" uuid NOT NULL,
	"tax_number" varchar(50) NOT NULL,
	"region" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."le_tax_registrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vritti_core"."business_units" ADD COLUMN "legal_entity_id" uuid;--> statement-breakpoint
ALTER TABLE "vritti_core"."business_units" ADD COLUMN "registration_id" uuid;--> statement-breakpoint
CREATE INDEX "legal_entities_organization_id_idx" ON "vritti_core"."legal_entities" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "legal_entities_org_code_unique" ON "vritti_core"."legal_entities" ("organization_id","code");--> statement-breakpoint
CREATE INDEX "le_tax_registrations_organization_id_idx" ON "vritti_core"."le_tax_registrations" ("organization_id");--> statement-breakpoint
CREATE INDEX "le_tax_registrations_legal_entity_id_idx" ON "vritti_core"."le_tax_registrations" ("legal_entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "le_tax_registrations_le_tax_number_unique" ON "vritti_core"."le_tax_registrations" ("legal_entity_id","tax_number");--> statement-breakpoint
ALTER TABLE "vritti_core"."legal_entities" ADD CONSTRAINT "legal_entities_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "vritti_core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."legal_entities" ADD CONSTRAINT "legal_entities_parent_id_legal_entities_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "vritti_core"."legal_entities"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."le_tax_registrations" ADD CONSTRAINT "le_tax_registrations_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "vritti_core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."le_tax_registrations" ADD CONSTRAINT "le_tax_registrations_legal_entity_id_legal_entities_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "vritti_core"."legal_entities"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."business_units" ADD CONSTRAINT "business_units_legal_entity_id_legal_entities_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "vritti_core"."legal_entities"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vritti_core"."business_units" ADD CONSTRAINT "business_units_registration_id_le_tax_registrations_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "vritti_core"."le_tax_registrations"("id") ON DELETE RESTRICT;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."legal_entities" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."le_tax_registrations" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));