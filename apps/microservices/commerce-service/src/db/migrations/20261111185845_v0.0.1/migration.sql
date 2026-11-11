ALTER TABLE "commerce"."orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "commerce"."orders" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
DROP TYPE "commerce"."order_status";--> statement-breakpoint
CREATE TYPE "commerce"."order_status" AS ENUM('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
ALTER TABLE "commerce"."orders" ALTER COLUMN "status" SET DATA TYPE "commerce"."order_status" USING "status"::"commerce"."order_status";--> statement-breakpoint
ALTER TABLE "commerce"."orders" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"commerce"."order_status";--> statement-breakpoint
ALTER TABLE "commerce"."orders" DROP COLUMN "external_order_id";--> statement-breakpoint
ALTER TABLE "commerce"."orders" DROP COLUMN "cancellation_reason";--> statement-breakpoint
ALTER TABLE "commerce"."orders" DROP COLUMN "paid_at";--> statement-breakpoint
ALTER TABLE "commerce"."orders" DROP COLUMN "payment_method";--> statement-breakpoint
ALTER TABLE "commerce"."orders" DROP COLUMN "payment_reference";--> statement-breakpoint
ALTER TABLE "commerce"."orders" ALTER COLUMN "currency_code" SET NOT NULL;--> statement-breakpoint
DROP TYPE "commerce"."order_item_status";