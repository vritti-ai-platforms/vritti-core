DROP INDEX "core"."uq_payment_gateway_configs_default";--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" DROP COLUMN "enabled_for_payments";--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" DROP COLUMN "is_default";