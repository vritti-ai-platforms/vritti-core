CREATE TABLE "core"."payout_channels" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"payout_account_id" uuid NOT NULL,
	"legal_entity_id" uuid NOT NULL,
	"site_id" uuid,
	"app_id" uuid,
	"channel" "core"."payment_channel",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_payout_channels_account_scope" UNIQUE NULLS NOT DISTINCT("payout_account_id","site_id","app_id","channel"),
	CONSTRAINT "payout_channels_app_channel_chk" CHECK ("app_id" IS NULL OR "channel" = 'APP')
);
--> statement-breakpoint
ALTER TABLE "core"."payout_channels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" ADD CONSTRAINT "uq_payout_accounts_id_le" UNIQUE("id","legal_entity_id");--> statement-breakpoint
CREATE INDEX "idx_payout_channels_le" ON "core"."payout_channels" ("legal_entity_id");--> statement-breakpoint
CREATE INDEX "idx_payout_channels_payout_account" ON "core"."payout_channels" ("payout_account_id");--> statement-breakpoint
ALTER TABLE "core"."payout_channels" ADD CONSTRAINT "payout_channels_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."payout_channels" ADD CONSTRAINT "payout_channels_legal_entity_id_legal_entities_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "core"."legal_entities"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "core"."payout_channels" ADD CONSTRAINT "payout_channels_site_id_sites_id_fkey" FOREIGN KEY ("site_id") REFERENCES "core"."sites"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."payout_channels" ADD CONSTRAINT "payout_channels_app_id_apps_id_fkey" FOREIGN KEY ("app_id") REFERENCES "core"."apps"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."payout_channels" ADD CONSTRAINT "payout_channels_payout_account_le_fkey" FOREIGN KEY ("payout_account_id","legal_entity_id") REFERENCES "core"."payout_accounts"("id","legal_entity_id") ON DELETE RESTRICT;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."payout_channels" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));