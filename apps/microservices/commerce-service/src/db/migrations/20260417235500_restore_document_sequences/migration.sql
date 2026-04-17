CREATE SEQUENCE IF NOT EXISTS "vritti_core"."purchase_order_number_seq";
CREATE SEQUENCE IF NOT EXISTS "vritti_core"."stock_adjustment_code_seq";
CREATE SEQUENCE IF NOT EXISTS "vritti_core"."order_number_seq";
CREATE SEQUENCE IF NOT EXISTS "vritti_core"."item_code_seq";
CREATE SEQUENCE IF NOT EXISTS "vritti_core"."inventory_item_batch_number_seq";

SELECT setval(
  'vritti_core.purchase_order_number_seq',
  GREATEST(
    COALESCE(
      (
        SELECT MAX(COALESCE((regexp_match(po_number, '([0-9]+)$'))[1]::bigint, 0))
        FROM "vritti_core"."purchase_orders"
      ),
      0
    ) + 1,
    1
  ),
  false
);

SELECT setval(
  'vritti_core.stock_adjustment_code_seq',
  GREATEST(
    COALESCE(
      (
        SELECT MAX(COALESCE((regexp_match(code, '([0-9]+)$'))[1]::bigint, 0))
        FROM "vritti_core"."stock_adjustments"
      ),
      0
    ) + 1,
    1
  ),
  false
);

SELECT setval(
  'vritti_core.order_number_seq',
  GREATEST(
    COALESCE(
      (
        SELECT MAX(COALESCE((regexp_match(order_number, '([0-9]+)$'))[1]::bigint, 0))
        FROM "vritti_core"."orders"
      ),
      0
    ) + 1,
    1
  ),
  false
);

SELECT setval(
  'vritti_core.item_code_seq',
  GREATEST(
    COALESCE(
      (
        SELECT MAX(COALESCE((regexp_match(code, '([0-9]+)$'))[1]::bigint, 0))
        FROM "vritti_core"."items"
      ),
      0
    ) + 1,
    1
  ),
  false
);

SELECT setval(
  'vritti_core.inventory_item_batch_number_seq',
  GREATEST(
    COALESCE(
      (
        SELECT MAX(COALESCE((regexp_match(batch_number, '([0-9]+)$'))[1]::bigint, 0))
        FROM "vritti_core"."inventory_item_batches"
      ),
      0
    ) + 1,
    1
  ),
  false
);
