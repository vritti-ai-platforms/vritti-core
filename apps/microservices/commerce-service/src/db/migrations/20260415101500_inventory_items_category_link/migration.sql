ALTER TABLE vritti_core.inventory_items
ADD COLUMN IF NOT EXISTS category_id uuid;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM vritti_core.inventory_items WHERE category_id IS NULL) THEN
    RAISE EXCEPTION 'inventory_items.category_id cannot be null for existing rows';
  END IF;
END $$;

ALTER TABLE vritti_core.inventory_items
ALTER COLUMN category_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_inventory_items_category'
  ) THEN
    ALTER TABLE vritti_core.inventory_items
    ADD CONSTRAINT fk_inventory_items_category
    FOREIGN KEY (category_id)
    REFERENCES vritti_core.categories(id)
    ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_inventory_items_category
ON vritti_core.inventory_items (category_id);
