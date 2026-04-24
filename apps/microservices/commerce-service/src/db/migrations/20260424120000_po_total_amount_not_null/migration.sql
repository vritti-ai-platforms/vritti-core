UPDATE vritti_core.purchase_orders SET total_amount = 0 WHERE total_amount IS NULL;

ALTER TABLE vritti_core.purchase_orders
  ALTER COLUMN total_amount SET NOT NULL,
  ALTER COLUMN total_amount SET DEFAULT 0;
