ALTER TABLE "core"."payout_accounts" DROP CONSTRAINT "payout_accounts_site_id_sites_id_fkey";--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" DROP CONSTRAINT "payout_accounts_app_id_apps_id_fkey";--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" DROP CONSTRAINT "uq_payout_accounts_scope";--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" DROP CONSTRAINT "payout_accounts_app_channel_chk";--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" DROP COLUMN "site_id";--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" DROP COLUMN "app_id";--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" DROP COLUMN "channel";--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" ADD CONSTRAINT "uq_payout_accounts_config_account" UNIQUE("payment_gateway_config_id","gateway_account_id");