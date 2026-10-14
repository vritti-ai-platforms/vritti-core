CREATE TYPE "core"."payment_gateway_config_type" AS ENUM('APP', 'POS', 'B2B');--> statement-breakpoint
CREATE TABLE "core"."payment_gateway_configs" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"legal_entity_id" uuid NOT NULL,
	"type" "core"."payment_gateway_config_type" NOT NULL,
	"site_id" uuid,
	"app_id" uuid,
	"gateway_code" varchar(100) NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"label" varchar(100),
	"key_id" varchar(255) NOT NULL,
	"credentials" text NOT NULL,
	"webhook_secret" text,
	"provider_merchant_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_payment_gateway_configs_scope" UNIQUE NULLS NOT DISTINCT("legal_entity_id","type","gateway_code","site_id","app_id"),
	CONSTRAINT "payment_gateway_configs_gateway_code_chk" CHECK ("gateway_code" ~ '^[a-z0-9][a-z0-9-]*$')
);
--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_payment_gateway_configs_le" ON "core"."payment_gateway_configs" ("legal_entity_id");--> statement-breakpoint
CREATE INDEX "idx_payment_gateway_configs_bank_account" ON "core"."payment_gateway_configs" ("bank_account_id");--> statement-breakpoint
CREATE INDEX "idx_payment_gateway_configs_site" ON "core"."payment_gateway_configs" ("site_id");--> statement-breakpoint
CREATE INDEX "idx_payment_gateway_configs_app" ON "core"."payment_gateway_configs" ("app_id");--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ADD CONSTRAINT "payment_gateway_configs_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ADD CONSTRAINT "payment_gateway_configs_legal_entity_id_legal_entities_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "core"."legal_entities"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ADD CONSTRAINT "payment_gateway_configs_site_id_sites_id_fkey" FOREIGN KEY ("site_id") REFERENCES "core"."sites"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ADD CONSTRAINT "payment_gateway_configs_app_id_apps_id_fkey" FOREIGN KEY ("app_id") REFERENCES "core"."apps"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ADD CONSTRAINT "payment_gateway_configs_bank_account_id_bank_accounts_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "core"."bank_accounts"("id") ON DELETE RESTRICT;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."payment_gateway_configs" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));