ALTER TABLE "payments"."payment_intents" ADD COLUMN "return_url" varchar(2048);--> statement-breakpoint
ALTER TABLE "payments"."payment_intents" ADD COLUMN "checkout_url" varchar(2048);