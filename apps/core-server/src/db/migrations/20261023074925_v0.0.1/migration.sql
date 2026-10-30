ALTER TABLE "core"."payout_accounts" DROP CONSTRAINT "payout_accounts_Wb2djfHfUwys_fkey";--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" ALTER COLUMN "gateway_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" ADD CONSTRAINT "uq_payout_accounts_bank_gateway" UNIQUE("bank_account_id","gateway_code");--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" ADD CONSTRAINT "payout_accounts_config_gateway_fkey" FOREIGN KEY ("payment_gateway_config_id","gateway_code") REFERENCES "core"."payment_gateway_configs"("id","gateway_code") ON DELETE RESTRICT;