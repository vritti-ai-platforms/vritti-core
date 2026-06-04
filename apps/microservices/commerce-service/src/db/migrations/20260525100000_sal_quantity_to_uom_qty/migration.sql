-- Rename stock_adjustment_lines.quantity → stock_adjustment_lines.uom_qty.
--
-- The column stores the line quantity expressed in the line's UOM (paired with primary_qty for the
-- item's primary UOM). Renaming makes the relationship explicit: the row carries (uom_qty, primary_qty)
-- analogous to the (primary_qty, uom_qty) pair on the uom and inventory_item_uom_conversions tables.

ALTER TABLE "vritti_core"."stock_adjustment_lines" RENAME COLUMN "quantity" TO "uom_qty";
