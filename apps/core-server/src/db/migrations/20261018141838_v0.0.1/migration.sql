-- Guarded: a database that ran the earlier one-config-per-kind version of this change already has the enum and the
-- first three columns, so each step only runs when its object is missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'core' AND t.typname = 'payment_gateway_config_kind'
  ) THEN
    CREATE TYPE "core"."payment_gateway_config_kind" AS ENUM('PLATFORM', 'ORG');
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ADD COLUMN IF NOT EXISTS "kind" "core"."payment_gateway_config_kind";--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ADD COLUMN IF NOT EXISTS "platform_fee_bps" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ADD COLUMN IF NOT EXISTS "enabled_for_payments" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ADD COLUMN IF NOT EXISTS "is_default" boolean DEFAULT false NOT NULL;
