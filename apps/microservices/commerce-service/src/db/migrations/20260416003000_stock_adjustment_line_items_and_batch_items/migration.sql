CREATE TABLE IF NOT EXISTS vritti_core.stock_adjustment_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT current_setting('app.org_id')::uuid,
  business_unit_id uuid NOT NULL DEFAULT current_setting('app.bu_id')::uuid,
  stock_adjustment_line_id uuid NOT NULL REFERENCES vritti_core.stock_adjustment_lines(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES vritti_core.inventory_items(id) ON DELETE RESTRICT,
  quantity numeric(12, 3) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sa_line_items_line ON vritti_core.stock_adjustment_line_items (stock_adjustment_line_id);
CREATE INDEX IF NOT EXISTS idx_sa_line_items_item ON vritti_core.stock_adjustment_line_items (inventory_item_id);

CREATE TABLE IF NOT EXISTS vritti_core.inventory_item_batch_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT current_setting('app.org_id')::uuid,
  business_unit_id uuid NOT NULL DEFAULT current_setting('app.bu_id')::uuid,
  inventory_item_batch_id uuid NOT NULL REFERENCES vritti_core.inventory_item_batches(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES vritti_core.inventory_items(id) ON DELETE RESTRICT,
  quantity numeric(12, 3) NOT NULL DEFAULT 0,
  reserved_quantity numeric(12, 3) NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT uq_inventory_batch_items_batch_item UNIQUE (inventory_item_batch_id, inventory_item_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_batch_items_batch
  ON vritti_core.inventory_item_batch_items (inventory_item_batch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batch_items_item
  ON vritti_core.inventory_item_batch_items (inventory_item_id);

INSERT INTO vritti_core.stock_adjustment_line_items (
  organization_id,
  business_unit_id,
  stock_adjustment_line_id,
  inventory_item_id,
  quantity,
  created_at,
  updated_at
)
SELECT
  sal.organization_id,
  sal.business_unit_id,
  sal.id,
  sa.inventory_item_id,
  sal.quantity,
  sal.created_at,
  COALESCE(sal.updated_at, sal.created_at)
FROM vritti_core.stock_adjustment_lines sal
INNER JOIN vritti_core.stock_adjustments sa ON sa.id = sal.stock_adjustment_id
LEFT JOIN vritti_core.stock_adjustment_line_items sqli
  ON sqli.stock_adjustment_line_id = sal.id
  AND sqli.inventory_item_id = sa.inventory_item_id
WHERE sqli.id IS NULL;

INSERT INTO vritti_core.inventory_item_batch_items (
  organization_id,
  business_unit_id,
  inventory_item_batch_id,
  inventory_item_id,
  quantity,
  reserved_quantity,
  created_at,
  updated_at
)
SELECT
  ib.organization_id,
  ib.business_unit_id,
  ib.id,
  ib.inventory_item_id,
  ib.quantity,
  ib.reserved_quantity,
  ib.created_at,
  COALESCE(ib.updated_at, ib.created_at)
FROM vritti_core.inventory_item_batches ib
LEFT JOIN vritti_core.inventory_item_batch_items ibi
  ON ibi.inventory_item_batch_id = ib.id
  AND ibi.inventory_item_id = ib.inventory_item_id
WHERE ibi.id IS NULL;
