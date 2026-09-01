CREATE TABLE "communications"."sms_otps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"app_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"provider" varchar(32) NOT NULL,
	"recipient" varchar(32) NOT NULL,
	"code_hash" varchar(255) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"message_id" varchar(128),
	"delivery_status" varchar(32),
	"delivered_at" timestamp with time zone,
	"error" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "communications"."sms_otps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_sms_otps_org" ON "communications"."sms_otps" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_sms_otps_lookup" ON "communications"."sms_otps" ("app_id","recipient","expires_at");--> statement-breakpoint
CREATE INDEX "idx_sms_otps_provider" ON "communications"."sms_otps" ("provider_id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "communications"."sms_otps" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));