-- Renames purchase_order_items.item_currency_code → supplier_item_currency_code.
-- Pure rename: no type, constraint, or default changes.

ALTER TABLE "vritti_core"."purchase_order_items"
  RENAME COLUMN "item_currency_code" TO "supplier_item_currency_code";
