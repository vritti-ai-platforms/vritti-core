-- Rename primary_qty → primary_uom_qty on item-scoped tables.
--
-- Parallels the (uomQty, primaryUomQty) naming so the pair reads symmetrically:
--   uomQty       = qty in the line's UOM
--   primaryUomQty = qty in the item's primary UOM
--
-- Touches three tables: inventory_item_uom_conversions, stock_adjustment_lines, purchase_order_items.
-- Global uom table is unaffected — it already uses base_uom_qty (dimension base concept).

-- ===== inventory_item_uom_conversions =====
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" RENAME COLUMN "primary_qty" TO "primary_uom_qty";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" RENAME CONSTRAINT "chk_iiuc_primary_qty_positive" TO "chk_iiuc_primary_uom_qty_positive";--> statement-breakpoint

-- ===== stock_adjustment_lines =====
ALTER TABLE "vritti_core"."stock_adjustment_lines" RENAME COLUMN "primary_qty" TO "primary_uom_qty";--> statement-breakpoint

-- ===== purchase_order_items =====
ALTER TABLE "vritti_core"."purchase_order_items" RENAME COLUMN "primary_qty" TO "primary_uom_qty";
