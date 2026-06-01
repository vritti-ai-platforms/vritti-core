-- Free-quantity (bonus/scheme) on Goods Receipts.
--   * New enum free_scheme_mode (slab | pro_rata).
--   * Scheme template on supplier_items; scheme + derived free_qty on purchase_order_items.
--   * goods_receipt_items: rename quantity -> total_qty, add ordered_qty + scheme + free_qty.
--     Invariant: total_qty = ordered_qty + free_qty. ordered_qty is the paid anchor that reconciles
--     against the PO; free_qty is bonus on top. Existing rows are all-paid (ordered_qty = total_qty).

CREATE TYPE "vritti_core"."free_scheme_mode" AS ENUM ('none', 'slab', 'pro_rata');--> statement-breakpoint

ALTER TABLE "vritti_core"."supplier_items"
  ADD COLUMN "scheme_buy_qty" numeric(12, 3),
  ADD COLUMN "scheme_free_qty" numeric(12, 3),
  ADD COLUMN "scheme_mode" "vritti_core"."free_scheme_mode" NOT NULL DEFAULT 'none';--> statement-breakpoint

ALTER TABLE "vritti_core"."purchase_order_items"
  ADD COLUMN "scheme_buy_qty" numeric(12, 3),
  ADD COLUMN "scheme_free_qty" numeric(12, 3),
  ADD COLUMN "scheme_mode" "vritti_core"."free_scheme_mode" NOT NULL DEFAULT 'none',
  ADD COLUMN "free_qty" numeric(12, 3) NOT NULL DEFAULT 0;--> statement-breakpoint

ALTER TABLE "vritti_core"."goods_receipt_items" RENAME COLUMN "quantity" TO "total_qty";--> statement-breakpoint

ALTER TABLE "vritti_core"."goods_receipt_items"
  ADD COLUMN "ordered_qty" numeric(12, 3) NOT NULL DEFAULT 0,
  ADD COLUMN "scheme_buy_qty" numeric(12, 3),
  ADD COLUMN "scheme_free_qty" numeric(12, 3),
  ADD COLUMN "scheme_mode" "vritti_core"."free_scheme_mode" NOT NULL DEFAULT 'none',
  ADD COLUMN "free_qty" numeric(12, 3) NOT NULL DEFAULT 0;--> statement-breakpoint

UPDATE "vritti_core"."goods_receipt_items" SET "ordered_qty" = "total_qty";
