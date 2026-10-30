ALTER TABLE "core"."payment_gateway_configs" ADD COLUMN "webhook_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ADD COLUMN "last_webhook_at" timestamp;