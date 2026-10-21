CREATE TABLE "core"."payout_accounts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"legal_entity_id" uuid NOT NULL,
	"site_id" uuid,
	"app_id" uuid,
	"channel" "core"."payment_gateway_config_type",
	"payment_gateway_config_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"gateway_account_id" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_payout_accounts_scope" UNIQUE NULLS NOT DISTINCT("legal_entity_id","site_id","app_id","channel","payment_gateway_config_id"),
	CONSTRAINT "payout_accounts_app_channel_chk" CHECK ("app_id" IS NULL OR "channel" = 'APP')
);
--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY "org_isolation" ON "core"."payment_linked_accounts";--> statement-breakpoint
DROP TABLE "core"."payment_linked_accounts";--> statement-breakpoint
ALTER TABLE "core"."bank_accounts" ADD CONSTRAINT "uq_bank_accounts_id_le" UNIQUE("id","legal_entity_id");--> statement-breakpoint
CREATE INDEX "idx_payout_accounts_le" ON "core"."payout_accounts" ("legal_entity_id");--> statement-breakpoint
CREATE INDEX "idx_payout_accounts_config" ON "core"."payout_accounts" ("payment_gateway_config_id");--> statement-breakpoint
CREATE INDEX "idx_payout_accounts_bank_account" ON "core"."payout_accounts" ("bank_account_id");--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" ADD CONSTRAINT "payout_accounts_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" ADD CONSTRAINT "payout_accounts_legal_entity_id_legal_entities_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "core"."legal_entities"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" ADD CONSTRAINT "payout_accounts_site_id_sites_id_fkey" FOREIGN KEY ("site_id") REFERENCES "core"."sites"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" ADD CONSTRAINT "payout_accounts_app_id_apps_id_fkey" FOREIGN KEY ("app_id") REFERENCES "core"."apps"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" ADD CONSTRAINT "payout_accounts_Wb2djfHfUwys_fkey" FOREIGN KEY ("payment_gateway_config_id") REFERENCES "core"."payment_gateway_configs"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" ADD CONSTRAINT "payout_accounts_bank_account_le_fkey" FOREIGN KEY ("bank_account_id","legal_entity_id") REFERENCES "core"."bank_accounts"("id","legal_entity_id") ON DELETE RESTRICT;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."payout_accounts" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));--> statement-breakpoint
DROP TYPE "core"."payment_linked_account_status";