ALTER TYPE "payments"."payment_intent_status" ADD VALUE 'REFUND_PENDING';--> statement-breakpoint
ALTER TYPE "payments"."payment_intent_status" ADD VALUE 'REFUNDED';--> statement-breakpoint
ALTER TYPE "payments"."payment_intent_status" ADD VALUE 'REFUND_FAILED';--> statement-breakpoint
ALTER TABLE "payments"."payment_intents" ADD COLUMN "refunded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments"."payment_intents" ADD COLUMN "refund_reference" varchar(100);--> statement-breakpoint
ALTER TABLE "payments"."payment_intents" ADD COLUMN "refund_failure_message" text;