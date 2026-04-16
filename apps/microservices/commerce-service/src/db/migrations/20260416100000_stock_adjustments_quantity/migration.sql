ALTER TABLE vritti_core.stock_adjustments
ADD COLUMN IF NOT EXISTS quantity numeric(12,3);

UPDATE vritti_core.stock_adjustments sa
SET quantity = COALESCE(lines.total_qty, 0)
FROM (
  SELECT stock_adjustment_id, COALESCE(SUM(quantity), 0) AS total_qty
  FROM vritti_core.stock_adjustment_lines
  GROUP BY stock_adjustment_id
) lines
WHERE sa.id = lines.stock_adjustment_id
  AND sa.quantity IS NULL;

UPDATE vritti_core.stock_adjustments
SET quantity = 0
WHERE quantity IS NULL;

ALTER TABLE vritti_core.stock_adjustments
ALTER COLUMN quantity SET NOT NULL;
