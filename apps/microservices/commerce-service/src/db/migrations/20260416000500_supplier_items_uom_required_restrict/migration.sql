UPDATE vritti_core.supplier_items si
SET uom_id = ii.uom_id
FROM vritti_core.inventory_items ii
WHERE si.inventory_item_id = ii.id
  AND si.uom_id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM vritti_core.supplier_items
    WHERE uom_id IS NULL
  ) THEN
    RAISE EXCEPTION 'supplier_items.uom_id cannot be null for existing rows';
  END IF;
END $$;

ALTER TABLE vritti_core.supplier_items
  ALTER COLUMN uom_id SET NOT NULL;

ALTER TABLE vritti_core.supplier_items
  DROP CONSTRAINT IF EXISTS supplier_items_uom_id_uom_id_fkey;

ALTER TABLE vritti_core.supplier_items
  ADD CONSTRAINT supplier_items_uom_id_uom_id_fkey
  FOREIGN KEY (uom_id)
  REFERENCES vritti_core.uom(id)
  ON DELETE RESTRICT;

ALTER TABLE vritti_core.inventory_items
  DROP CONSTRAINT IF EXISTS inventory_items_uom_id_uom_id_fkey;

ALTER TABLE vritti_core.inventory_items
  ADD CONSTRAINT inventory_items_uom_id_uom_id_fkey
  FOREIGN KEY (uom_id)
  REFERENCES vritti_core.uom(id)
  ON DELETE RESTRICT;
