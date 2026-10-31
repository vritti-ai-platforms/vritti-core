-- Renames the payout channel tables. The new name of the second table is the old name of the first, so the first
-- table is renamed out of the way before the second takes its name. Data, grants and RLS policies move with the tables.
--   core.payout_channels          -> core.payout_channel_bank_accounts  (a scope pays into this bank account)
--   core.payout_channel_accounts  -> core.payout_channels               (a payout account switched on for the scope)

-- 1. The scope's bank account
ALTER TABLE "core"."payout_channels" RENAME TO "payout_channel_bank_accounts";--> statement-breakpoint
ALTER TABLE "core"."payout_channel_bank_accounts" RENAME CONSTRAINT "payout_channels_pkey" TO "payout_channel_bank_accounts_pkey";--> statement-breakpoint
ALTER TABLE "core"."payout_channel_bank_accounts" RENAME CONSTRAINT "uq_payout_channels_id_bank" TO "uq_payout_channel_bank_accounts_id_bank";--> statement-breakpoint
ALTER TABLE "core"."payout_channel_bank_accounts" RENAME CONSTRAINT "uq_payout_channels_scope" TO "uq_payout_channel_bank_accounts_scope";--> statement-breakpoint
ALTER TABLE "core"."payout_channel_bank_accounts" RENAME CONSTRAINT "payout_channels_app_channel_chk" TO "payout_channel_bank_accounts_app_channel_chk";--> statement-breakpoint
ALTER TABLE "core"."payout_channel_bank_accounts" RENAME CONSTRAINT "payout_channels_bank_account_le_fkey" TO "payout_channel_bank_accounts_bank_account_le_fkey";--> statement-breakpoint
ALTER TABLE "core"."payout_channel_bank_accounts" RENAME CONSTRAINT "payout_channels_organization_id_organizations_id_fkey" TO "payout_channel_bank_accounts_organization_id_organizations_id_fkey";--> statement-breakpoint
ALTER TABLE "core"."payout_channel_bank_accounts" RENAME CONSTRAINT "payout_channels_legal_entity_id_legal_entities_id_fkey" TO "payout_channel_bank_accounts_legal_entity_id_legal_entities_id_fkey";--> statement-breakpoint
ALTER TABLE "core"."payout_channel_bank_accounts" RENAME CONSTRAINT "payout_channels_site_id_sites_id_fkey" TO "payout_channel_bank_accounts_site_id_sites_id_fkey";--> statement-breakpoint
ALTER TABLE "core"."payout_channel_bank_accounts" RENAME CONSTRAINT "payout_channels_app_id_apps_id_fkey" TO "payout_channel_bank_accounts_app_id_apps_id_fkey";--> statement-breakpoint
ALTER INDEX "core"."idx_payout_channels_le" RENAME TO "idx_payout_channel_bank_accounts_le";--> statement-breakpoint
ALTER INDEX "core"."idx_payout_channels_bank_account" RENAME TO "idx_payout_channel_bank_accounts_bank_account";--> statement-breakpoint

-- 2. The payout accounts switched on for a scope
ALTER TABLE "core"."payout_channel_accounts" RENAME TO "payout_channels";--> statement-breakpoint
ALTER TABLE "core"."payout_channels" RENAME COLUMN "payout_channel_id" TO "payout_channel_bank_account_id";--> statement-breakpoint
ALTER TABLE "core"."payout_channels" RENAME CONSTRAINT "payout_channel_accounts_pkey" TO "payout_channels_pkey";--> statement-breakpoint
ALTER TABLE "core"."payout_channels" RENAME CONSTRAINT "uq_payout_channel_accounts_channel_account" TO "uq_payout_channels_channel_account";--> statement-breakpoint
ALTER TABLE "core"."payout_channels" RENAME CONSTRAINT "payout_channel_accounts_channel_bank_fkey" TO "payout_channels_channel_bank_fkey";--> statement-breakpoint
ALTER TABLE "core"."payout_channels" RENAME CONSTRAINT "payout_channel_accounts_account_bank_fkey" TO "payout_channels_account_bank_fkey";--> statement-breakpoint
ALTER TABLE "core"."payout_channels" RENAME CONSTRAINT "payout_channel_accounts_organization_id_organizations_id_fkey" TO "payout_channels_organization_id_organizations_id_fkey";--> statement-breakpoint
ALTER INDEX "core"."idx_payout_channel_accounts_account" RENAME TO "idx_payout_channels_account";
