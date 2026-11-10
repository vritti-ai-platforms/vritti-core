CREATE TYPE "commerce"."inbound_delivery_source" AS ENUM('ANNOUNCED', 'RECEIPT');--> statement-breakpoint
ALTER TABLE "commerce"."inbound_deliveries" ADD COLUMN "source" "commerce"."inbound_delivery_source" DEFAULT 'ANNOUNCED'::"commerce"."inbound_delivery_source" NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipts" ALTER COLUMN "inbound_delivery_id" SET NOT NULL;