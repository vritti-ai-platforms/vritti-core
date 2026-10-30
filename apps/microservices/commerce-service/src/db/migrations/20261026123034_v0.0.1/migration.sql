ALTER TABLE "commerce"."orders" DROP CONSTRAINT "uq_orders_party_checkout_key";--> statement-breakpoint
ALTER TABLE "commerce"."orders" DROP COLUMN "checkout_key";