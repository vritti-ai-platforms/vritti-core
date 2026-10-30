ALTER TABLE "core"."payment_gateway_configs" DROP CONSTRAINT "uq_payment_gateway_configs_org_label";--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" DROP COLUMN "label";--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ADD CONSTRAINT "uq_payment_gateway_configs_org_gateway" UNIQUE NULLS NOT DISTINCT("organization_id","gateway_code");