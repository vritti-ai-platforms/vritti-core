CREATE TABLE "communications"."sms_provider_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"provider_id" uuid NOT NULL,
	"template_id" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"details" jsonb DEFAULT '{}' NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_sms_provider_templates_provider_template" UNIQUE("provider_id","template_id")
);
--> statement-breakpoint
ALTER TABLE "communications"."sms_provider_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_sms_provider_templates_provider" ON "communications"."sms_provider_templates" ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_sms_provider_templates_org" ON "communications"."sms_provider_templates" ("organization_id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "communications"."sms_provider_templates" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));