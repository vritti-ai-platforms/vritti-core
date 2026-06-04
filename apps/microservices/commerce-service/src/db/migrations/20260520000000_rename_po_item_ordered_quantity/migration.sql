-- Renames purchase_order_items.ordered_quantity → quantity.
-- Pure rename: no type, constraint, or default changes.

ALTER TABLE vritti_core.purchase_order_items
  RENAME COLUMN ordered_quantity TO quantity;
