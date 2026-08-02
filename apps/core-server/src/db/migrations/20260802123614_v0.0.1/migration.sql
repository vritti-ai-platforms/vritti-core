CREATE TYPE "core"."service_type" AS ENUM('GITEA');--> statement-breakpoint
CREATE TABLE "core"."org_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"service" "core"."service_type" NOT NULL,
	"external_id" varchar(255),
	"external_name" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "core"."org_services" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "org_services_organization_id_idx" ON "core"."org_services" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_services_org_service_unique" ON "core"."org_services" ("organization_id","service");--> statement-breakpoint
ALTER TABLE "core"."org_services" ADD CONSTRAINT "org_services_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."org_services" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));