ALTER TABLE vritti_core.stock_adjustment_lines
  ADD COLUMN IF NOT EXISTS is_balanced boolean NOT NULL DEFAULT false;

UPDATE vritti_core.stock_adjustment_lines sal
SET is_balanced = (
  COALESCE((
    SELECT COUNT(*)
    FROM vritti_core.stock_adjustment_line_items li
    WHERE li.stock_adjustment_line_id = sal.id
  ), 0) > 0
  AND COALESCE((
    SELECT SUM(li.quantity)
    FROM vritti_core.stock_adjustment_line_items li
    WHERE li.stock_adjustment_line_id = sal.id
  ), 0) = sal.quantity
);
