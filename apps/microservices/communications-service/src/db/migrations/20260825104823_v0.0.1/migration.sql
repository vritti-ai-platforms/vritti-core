CREATE SCHEMA "communications";
--> statement-breakpoint
CREATE TABLE "communications"."whatsapp_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"legal_entity_id" uuid,
	"meta_business_id" varchar(64) NOT NULL,
	"waba_id" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"access_token" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_whatsapp_accounts_org_waba" UNIQUE("organization_id","waba_id")
);
--> statement-breakpoint
ALTER TABLE "communications"."whatsapp_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_whatsapp_accounts_org_default" ON "communications"."whatsapp_accounts" ("organization_id") WHERE is_default = true;--> statement-breakpoint
CREATE INDEX "idx_whatsapp_accounts_org" ON "communications"."whatsapp_accounts" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_whatsapp_accounts_le" ON "communications"."whatsapp_accounts" ("legal_entity_id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "communications"."whatsapp_accounts" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));