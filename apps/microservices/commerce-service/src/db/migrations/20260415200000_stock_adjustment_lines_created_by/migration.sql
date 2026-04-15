ALTER TABLE vritti_core.stock_adjustment_lines
  ADD COLUMN IF NOT EXISTS created_by_id uuid;

UPDATE vritti_core.stock_adjustment_lines sal
SET created_by_id = sa.created_by_id
FROM vritti_core.stock_adjustments sa
WHERE sa.id = sal.stock_adjustment_id
  AND sal.created_by_id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM vritti_core.stock_adjustment_lines
    WHERE created_by_id IS NULL
  ) THEN
    RAISE EXCEPTION 'stock_adjustment_lines.created_by_id cannot be null for existing rows';
  END IF;
END $$;

ALTER TABLE vritti_core.stock_adjustment_lines
  ALTER COLUMN created_by_id SET NOT NULL;

ALTER TABLE vritti_core.stock_adjustment_lines
  DROP CONSTRAINT IF EXISTS stock_adjustment_lines_created_by_id_users_id_fkey;

ALTER TABLE vritti_core.stock_adjustment_lines
  ADD CONSTRAINT stock_adjustment_lines_created_by_id_users_id_fkey
  FOREIGN KEY (created_by_id)
  REFERENCES vritti_core.users(id)
  ON DELETE RESTRICT;
