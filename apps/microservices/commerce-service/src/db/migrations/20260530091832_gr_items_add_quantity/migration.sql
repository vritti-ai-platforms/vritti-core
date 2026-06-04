-- Operator-declared accepted quantity on the GR item. Previously the accepted amount was derived as
-- SUM(goods_receipt_lines.quantity) and balance was checked against the PO line's remaining quantity.
-- Now the operator enters the quantity received for the item (capped by PO remaining when linked);
-- lots/lines distribute it and the item is balanced once they sum to this value.
--
-- Added nullable first so the backfill can run, then tightened to NOT NULL DEFAULT 0. Backfill sets
-- each item's quantity to its current distributed line sum, preserving existing balance state.

ALTER TABLE "vritti_core"."goods_receipt_items"
  ADD COLUMN "quantity" numeric(12, 3);--> statement-breakpoint

UPDATE "vritti_core"."goods_receipt_items" gri
SET "quantity" = COALESCE((
  SELECT SUM(grl."quantity")
  FROM "vritti_core"."goods_receipt_lines" grl
  WHERE grl."goods_receipt_item_id" = gri."id"
), 0);--> statement-breakpoint

ALTER TABLE "vritti_core"."goods_receipt_items"
  ALTER COLUMN "quantity" SET DEFAULT 0,
  ALTER COLUMN "quantity" SET NOT NULL;
