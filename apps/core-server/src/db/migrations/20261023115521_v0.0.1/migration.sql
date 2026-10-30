CREATE TABLE "core"."payout_channel_accounts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"payout_channel_id" uuid NOT NULL,
	"payout_account_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_payout_channel_accounts_channel_account" UNIQUE("payout_channel_id","payout_account_id")
);
--> statement-breakpoint
ALTER TABLE "core"."payout_channel_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "core"."payout_channels" ADD COLUMN "bank_account_id" uuid;--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" ADD CONSTRAINT "uq_payout_accounts_id_bank" UNIQUE("id","bank_account_id");--> statement-breakpoint
ALTER TABLE "core"."payout_channels" ADD CONSTRAINT "uq_payout_channels_id_bank" UNIQUE("id","bank_account_id");--> statement-breakpoint
CREATE INDEX "idx_payout_channel_accounts_account" ON "core"."payout_channel_accounts" ("payout_account_id");--> statement-breakpoint
ALTER TABLE "core"."payout_channels" ADD CONSTRAINT "payout_channels_bank_account_le_fkey" FOREIGN KEY ("bank_account_id","legal_entity_id") REFERENCES "core"."bank_accounts"("id","legal_entity_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "core"."payout_channel_accounts" ADD CONSTRAINT "payout_channel_accounts_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."payout_channel_accounts" ADD CONSTRAINT "payout_channel_accounts_channel_bank_fkey" FOREIGN KEY ("payout_channel_id","bank_account_id") REFERENCES "core"."payout_channels"("id","bank_account_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."payout_channel_accounts" ADD CONSTRAINT "payout_channel_accounts_account_bank_fkey" FOREIGN KEY ("payout_account_id","bank_account_id") REFERENCES "core"."payout_accounts"("id","bank_account_id") ON DELETE RESTRICT;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."payout_channel_accounts" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));