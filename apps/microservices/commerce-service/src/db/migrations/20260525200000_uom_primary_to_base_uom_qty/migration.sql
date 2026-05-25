-- Rename uom.primary_qty → uom.base_uom_qty.
--
-- The `uom` table is global (not item-scoped); its `(primary_qty, uom_qty)` pair always meant
-- "uom_qty of THIS UOM = primary_qty of the dimension's BASE UOM". Renaming to `base_uom_qty`
-- removes the cross-table collision with `primaryQty` on item-scoped tables
-- (inventory_item_uom_conversions, stock_adjustment_lines, purchase_order_items), where "primary"
-- means the *item's* primary UOM. After this rename: `primary*` = item-primary, `base*` = dimension-base.

ALTER TABLE "vritti_core"."uom" RENAME COLUMN "primary_qty" TO "base_uom_qty";--> statement-breakpoint
ALTER TABLE "vritti_core"."uom" RENAME CONSTRAINT "chk_uom_primary_qty_positive" TO "chk_uom_base_uom_qty_positive";
