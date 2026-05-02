-- Add supplier_id to inventory_item_quants for consignment stock tracking.
-- NULL = owned stock, non-null = supplier-owned (consignment).

BEGIN;

ALTER TABLE vritti_core.inventory_item_quants
  ADD COLUMN supplier_id uuid REFERENCES vritti_core.suppliers(id) ON DELETE RESTRICT;

CREATE INDEX idx_inventory_item_quants_supplier
  ON vritti_core.inventory_item_quants (supplier_id);

COMMIT;
