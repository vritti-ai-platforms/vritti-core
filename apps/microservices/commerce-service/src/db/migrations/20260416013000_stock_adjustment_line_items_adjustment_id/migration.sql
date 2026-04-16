ALTER TABLE vritti_core.stock_adjustment_line_items
ADD COLUMN IF NOT EXISTS stock_adjustment_id uuid;

UPDATE vritti_core.stock_adjustment_line_items li
SET stock_adjustment_id = l.stock_adjustment_id
FROM vritti_core.stock_adjustment_lines l
WHERE l.id = li.stock_adjustment_line_id
  AND li.stock_adjustment_id IS NULL;

ALTER TABLE vritti_core.stock_adjustment_line_items
ALTER COLUMN stock_adjustment_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'stock_adjustment_line_items_stock_adjustment_id_stock_adjustments_id_fk'
  ) THEN
    ALTER TABLE vritti_core.stock_adjustment_line_items
    ADD CONSTRAINT stock_adjustment_line_items_stock_adjustment_id_stock_adjustments_id_fk
      FOREIGN KEY (stock_adjustment_id)
      REFERENCES vritti_core.stock_adjustments(id)
      ON DELETE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_sa_line_items_adjustment
  ON vritti_core.stock_adjustment_line_items (stock_adjustment_id);
