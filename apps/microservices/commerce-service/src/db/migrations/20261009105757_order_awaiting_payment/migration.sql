ALTER TYPE "commerce"."order_status" ADD VALUE 'AWAITING_PAYMENT' BEFORE 'PENDING';--> statement-breakpoint
ALTER TABLE "commerce"."order_items" ADD COLUMN "sku" varchar(200);--> statement-breakpoint
ALTER TABLE "commerce"."orders" ADD COLUMN "party_id" uuid;--> statement-breakpoint
ALTER TABLE "commerce"."orders" ADD COLUMN "currency_code" varchar(3);--> statement-breakpoint
ALTER TABLE "commerce"."orders" ADD COLUMN "payment_intent_id" uuid;--> statement-breakpoint
ALTER TABLE "commerce"."orders" ADD COLUMN "paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "commerce"."orders" ADD COLUMN "payment_method" varchar(30);--> statement-breakpoint
ALTER TABLE "commerce"."orders" ADD COLUMN "payment_reference" varchar(100);--> statement-breakpoint
ALTER TABLE "commerce"."orders" ADD COLUMN "needs_review" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."orders" ADD CONSTRAINT "uq_orders_payment_intent" UNIQUE("payment_intent_id");--> statement-breakpoint
CREATE INDEX "idx_orders_party" ON "commerce"."orders" ("organization_id","party_id");--> statement-breakpoint
ALTER TABLE "commerce"."orders" ADD CONSTRAINT "orders_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "commerce"."parties"("id") ON DELETE SET NULL;