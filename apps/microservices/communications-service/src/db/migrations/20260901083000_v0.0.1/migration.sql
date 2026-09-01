CREATE TABLE "communications"."sms_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid),
	"type" varchar(16) NOT NULL,
	"provider" varchar(32) NOT NULL,
	"name" varchar(255) NOT NULL,
	"credentials" jsonb DEFAULT '{}' NOT NULL,
	"sender_id" varchar(64),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_sms_providers_org_name" UNIQUE("organization_id","name")
);
--> statement-breakpoint
ALTER TABLE "communications"."sms_providers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_sms_providers_org" ON "communications"."sms_providers" ("organization_id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "communications"."sms_providers" AS PERMISSIVE FOR ALL TO public USING (organization_id IS NULL OR organization_id = (select current_setting('app.org_id', true)::uuid));