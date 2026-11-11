ALTER TABLE "payments"."payment_intents" RENAME COLUMN "checkout_id" TO "target_id";--> statement-breakpoint
ALTER INDEX "payments"."idx_payment_intents_checkout" RENAME TO "idx_payment_intents_target";--> statement-breakpoint
ALTER INDEX "payments"."uq_payment_intents_one_active_per_checkout" RENAME TO "uq_payment_intents_one_active_per_target";--> statement-breakpoint
DROP INDEX "payments"."uq_payment_intents_one_active_per_target";--> statement-breakpoint
CREATE UNIQUE INDEX "uq_payment_intents_one_active_per_target" ON "payments"."payment_intents" ("organization_id","target_id") WHERE target_id IS NOT NULL AND status IN ('CREATED', 'REQUIRES_ACTION', 'PROCESSING');