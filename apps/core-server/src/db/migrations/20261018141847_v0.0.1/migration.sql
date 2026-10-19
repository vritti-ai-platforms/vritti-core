ALTER TABLE "core"."payment_gateway_configs" DROP CONSTRAINT IF EXISTS "payment_gateway_configs_legal_entity_id_legal_entities_id_fkey";--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" DROP CONSTRAINT IF EXISTS "payment_gateway_configs_site_id_sites_id_fkey";--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" DROP CONSTRAINT IF EXISTS "payment_gateway_configs_app_id_apps_id_fkey";--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" DROP CONSTRAINT IF EXISTS "payment_gateway_configs_bank_account_id_bank_accounts_id_fkey";--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" DROP CONSTRAINT IF EXISTS "uq_payment_gateway_configs_scope";--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" DROP CONSTRAINT IF EXISTS "uq_payment_gateway_configs_org_kind";--> statement-breakpoint
DROP INDEX IF EXISTS "core"."idx_payment_gateway_configs_le";--> statement-breakpoint
DROP INDEX IF EXISTS "core"."idx_payment_gateway_configs_bank_account";--> statement-breakpoint
DROP INDEX IF EXISTS "core"."idx_payment_gateway_configs_site";--> statement-breakpoint
DROP INDEX IF EXISTS "core"."idx_payment_gateway_configs_app";--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" DROP COLUMN IF EXISTS "legal_entity_id";--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" DROP COLUMN IF EXISTS "type";--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" DROP COLUMN IF EXISTS "site_id";--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" DROP COLUMN IF EXISTS "app_id";--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" DROP COLUMN IF EXISTS "bank_account_id";--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" DROP COLUMN IF EXISTS "split_enabled";--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ALTER COLUMN "organization_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ALTER COLUMN "kind" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ALTER COLUMN "label" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" DROP CONSTRAINT IF EXISTS "uq_payment_gateway_configs_org_label";--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ADD CONSTRAINT "uq_payment_gateway_configs_org_label" UNIQUE NULLS NOT DISTINCT("organization_id","label");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_payment_gateway_configs_default" ON "core"."payment_gateway_configs" (coalesce("organization_id", '00000000-0000-0000-0000-000000000000'::uuid)) WHERE "is_default";--> statement-breakpoint
ALTER TABLE "core"."payment_linked_accounts" DROP CONSTRAINT IF EXISTS "payment_linked_accounts_YM0xWIruo2IO_fkey", ADD CONSTRAINT "payment_linked_accounts_YM0xWIruo2IO_fkey" FOREIGN KEY ("collector_config_id") REFERENCES "core"."payment_gateway_configs"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" DROP CONSTRAINT IF EXISTS "payment_gateway_configs_kind_org_chk";--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ADD CONSTRAINT "payment_gateway_configs_kind_org_chk" CHECK (("kind" = 'PLATFORM' AND "organization_id" IS NULL) OR ("kind" = 'ORG' AND "organization_id" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" DROP CONSTRAINT IF EXISTS "payment_gateway_configs_fee_bps_chk";--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ADD CONSTRAINT "payment_gateway_configs_fee_bps_chk" CHECK ("platform_fee_bps" >= 0 AND "platform_fee_bps" <= 10000);--> statement-breakpoint
ALTER POLICY "org_isolation" ON "core"."payment_gateway_configs" TO public USING (organization_id IS NULL OR organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));