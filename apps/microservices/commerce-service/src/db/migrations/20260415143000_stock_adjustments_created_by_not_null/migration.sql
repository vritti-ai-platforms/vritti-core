DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM vritti_core.stock_adjustments
    WHERE created_by_id IS NULL
  ) THEN
    RAISE EXCEPTION 'stock_adjustments.created_by_id cannot be null for existing rows';
  END IF;
END $$;

ALTER TABLE vritti_core.stock_adjustments
ALTER COLUMN created_by_id SET NOT NULL;
