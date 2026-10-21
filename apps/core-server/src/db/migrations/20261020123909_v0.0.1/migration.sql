ALTER TABLE "core"."payment_gateway_configs" RENAME COLUMN "provider_merchant_id" TO "gateway_account_id";--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" ADD COLUMN "is_main_account" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ALTER COLUMN "gateway_account_id" SET NOT NULL;