-- Rename purchase_order_items.quantity → purchase_order_items.uom_qty.
--
-- Parallels stock_adjustment_lines and aligns the line columns as the (uomQty, primaryUomQty) pair:
--   uomQty        = ordered amount in the line's UOM (e.g., 5 boxes)
--   primaryUomQty = same amount converted to the item's primary UOM (e.g., 60 each)
--
-- `received_quantity` is intentionally left as-is — its semantics are "received in the line UOM",
-- a separate field that mirrors uomQty's units.

ALTER TABLE "vritti_core"."purchase_order_items" RENAME COLUMN "quantity" TO "uom_qty";
