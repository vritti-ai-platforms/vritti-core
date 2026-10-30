CREATE SCHEMA "communications";
--> statement-breakpoint
CREATE TABLE "communications"."sms_otps" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
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
CREATE TABLE "communications"."sms_providers" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
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
CREATE TABLE "communications"."sms_provider_templates" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
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
CREATE TABLE "communications"."whatsapp_accounts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"legal_entity_id" uuid,
	"meta_business_id" varchar(64) NOT NULL,
	"waba_id" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"access_token" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"webhooks_subscribed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_whatsapp_accounts_org_waba" UNIQUE("organization_id","waba_id")
);
--> statement-breakpoint
ALTER TABLE "communications"."whatsapp_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "communications"."whatsapp_otps" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"app_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
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
ALTER TABLE "communications"."whatsapp_otps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_sms_otps_org" ON "communications"."sms_otps" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_sms_otps_lookup" ON "communications"."sms_otps" ("app_id","recipient","expires_at");--> statement-breakpoint
CREATE INDEX "idx_sms_otps_provider" ON "communications"."sms_otps" ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_sms_providers_org" ON "communications"."sms_providers" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_sms_provider_templates_provider" ON "communications"."sms_provider_templates" ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_sms_provider_templates_org" ON "communications"."sms_provider_templates" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_whatsapp_accounts_org" ON "communications"."whatsapp_accounts" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_whatsapp_accounts_le" ON "communications"."whatsapp_accounts" ("legal_entity_id");--> statement-breakpoint
CREATE INDEX "idx_whatsapp_otps_org" ON "communications"."whatsapp_otps" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_whatsapp_otps_lookup" ON "communications"."whatsapp_otps" ("app_id","recipient","expires_at");--> statement-breakpoint
CREATE INDEX "idx_whatsapp_otps_account" ON "communications"."whatsapp_otps" ("account_id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "communications"."sms_otps" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "communications"."sms_providers" AS PERMISSIVE FOR ALL TO public USING (organization_id IS NULL OR organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "communications"."sms_provider_templates" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "communications"."whatsapp_accounts" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "communications"."whatsapp_otps" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));