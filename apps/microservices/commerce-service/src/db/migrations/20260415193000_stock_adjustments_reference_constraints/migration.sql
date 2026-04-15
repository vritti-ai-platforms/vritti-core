DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM vritti_core.stock_adjustments sa
    LEFT JOIN vritti_core.users u ON u.id = sa.created_by_id
    WHERE u.id IS NULL
  ) THEN
    RAISE EXCEPTION 'stock_adjustments.created_by_id references missing users';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM vritti_core.stock_adjustments sa
    LEFT JOIN vritti_core.inventory_items ii ON ii.id = sa.inventory_item_id
    WHERE ii.id IS NULL
  ) THEN
    RAISE EXCEPTION 'stock_adjustments.inventory_item_id references missing inventory_items';
  END IF;
END $$;

ALTER TABLE vritti_core.stock_adjustments
  DROP CONSTRAINT IF EXISTS stock_adjustments_inventory_item_id_inventory_items_id_fkey;

ALTER TABLE vritti_core.stock_adjustments
  ADD CONSTRAINT stock_adjustments_inventory_item_id_inventory_items_id_fkey
  FOREIGN KEY (inventory_item_id)
  REFERENCES vritti_core.inventory_items(id)
  ON DELETE RESTRICT;

ALTER TABLE vritti_core.stock_adjustments
  DROP CONSTRAINT IF EXISTS stock_adjustments_created_by_id_users_id_fkey;

ALTER TABLE vritti_core.stock_adjustments
  ADD CONSTRAINT stock_adjustments_created_by_id_users_id_fkey
  FOREIGN KEY (created_by_id)
  REFERENCES vritti_core.users(id)
  ON DELETE RESTRICT;
