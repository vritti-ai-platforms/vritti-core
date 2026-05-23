-- PO currency redesign:
-- - PO header currency_code becomes a supplier snapshot (no longer user-selectable).
-- - conversion_rate → exchange_rate (nullable, to accommodate VARIABLE policy).
-- - exchange_rate_type enum: FIXED locks rate at PO time, VARIABLE defers to GR/invoice posting.
-- - PO line items carry their own currency_code snapshot; supplier_unit_price column is dropped.

CREATE TYPE "vritti_core"."exchange_rate_type" AS ENUM ('FIXED', 'VARIABLE');--> statement-breakpoint

ALTER TABLE "vritti_core"."purchase_orders" RENAME COLUMN "conversion_rate" TO "exchange_rate";--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_orders" ALTER COLUMN "exchange_rate" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_orders" ADD COLUMN "exchange_rate_type" "vritti_core"."exchange_rate_type" NOT NULL DEFAULT 'FIXED';--> statement-breakpoint

ALTER TABLE "vritti_core"."purchase_order_items" ADD COLUMN "currency_code" varchar(3);--> statement-breakpoint
UPDATE "vritti_core"."purchase_order_items" AS poi
  SET "currency_code" = po."currency_code"
  FROM "vritti_core"."purchase_orders" AS po
  WHERE poi."purchase_order_id" = po."id";--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_order_items" ALTER COLUMN "currency_code" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "vritti_core"."purchase_order_items" DROP COLUMN "supplier_unit_price";
