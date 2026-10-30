ALTER TABLE "core"."payout_channels" DROP CONSTRAINT "payout_channels_payout_account_le_fkey";--> statement-breakpoint
ALTER TABLE "core"."payout_channels" DROP CONSTRAINT "uq_payout_channels_account_scope";--> statement-breakpoint
DROP INDEX "core"."idx_payout_channels_payout_account";--> statement-breakpoint
ALTER TABLE "core"."payout_channels" DROP COLUMN "payout_account_id";--> statement-breakpoint
ALTER TABLE "core"."payout_channels" ALTER COLUMN "bank_account_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."payout_channels" ADD CONSTRAINT "uq_payout_channels_scope" UNIQUE NULLS NOT DISTINCT("legal_entity_id","site_id","app_id","channel");--> statement-breakpoint
CREATE INDEX "idx_payout_channels_bank_account" ON "core"."payout_channels" ("bank_account_id");