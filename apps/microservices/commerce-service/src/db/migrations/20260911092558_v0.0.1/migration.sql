CREATE TABLE "commerce"."tax_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"legal_entity_id" uuid NOT NULL,
	"jurisdiction_id" uuid NOT NULL,
	"registration_number" varchar(50) NOT NULL,
	"registration_type" "commerce"."tax_registration_type" NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_tax_registrations_le_juris" UNIQUE("legal_entity_id","jurisdiction_id"),
	CONSTRAINT "uq_tax_registrations_org_number" UNIQUE("organization_id","registration_number")
);
--> statement-breakpoint
ALTER TABLE "commerce"."tax_registrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_tax_registrations_le" ON "commerce"."tax_registrations" ("legal_entity_id");--> statement-breakpoint
ALTER TABLE "commerce"."tax_registrations" ADD CONSTRAINT "tax_registrations_jurisdiction_id_tax_jurisdictions_id_fkey" FOREIGN KEY ("jurisdiction_id") REFERENCES "commerce"."tax_jurisdictions"("id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."tax_registrations" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));