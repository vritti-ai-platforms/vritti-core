-- Replace the slab/pro_rata scheme_mode with a has_scheme flag. pro_rata is dropped — it is not a
-- real-world free-goods practice for discrete units; a scheme is now just the buy+free ratio gated by a boolean.
ALTER TABLE "vritti_core"."supplier_items" ADD COLUMN "has_scheme" boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_order_items" ADD COLUMN "has_scheme" boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_items" ADD COLUMN "has_scheme" boolean NOT NULL DEFAULT false;--> statement-breakpoint

UPDATE "vritti_core"."supplier_items" SET "has_scheme" = true WHERE "scheme_buy_qty" IS NOT NULL AND "scheme_free_qty" IS NOT NULL;--> statement-breakpoint
UPDATE "vritti_core"."purchase_order_items" SET "has_scheme" = true WHERE "scheme_buy_qty" IS NOT NULL AND "scheme_free_qty" IS NOT NULL;--> statement-breakpoint
UPDATE "vritti_core"."goods_receipt_items" SET "has_scheme" = true WHERE "scheme_buy_qty" IS NOT NULL AND "scheme_free_qty" IS NOT NULL;--> statement-breakpoint

ALTER TABLE "vritti_core"."supplier_items" DROP COLUMN "scheme_mode";--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_order_items" DROP COLUMN "scheme_mode";--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_items" DROP COLUMN "scheme_mode";--> statement-breakpoint

DROP TYPE "vritti_core"."free_scheme_mode";
