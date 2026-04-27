-- Goods Receipts redesign — mirror Stock Adjustments
--
-- Redesigns goods_receipt_batches/batch_items into the same drafts↔inventory pattern
-- we use for stock_adjustments: lots entered once per item, distributed across N
-- location lines, with serials per line for tracking='serial' items.
--
-- - Drops ALLOCATION_PENDING status (collapses to DRAFT → PUBLISHED, single step).
-- - Drops accepted_quantity from goods_receipt_items (derived from sum(lines.quantity)).
-- - Renames goods_receipt_batches → goods_receipt_lines (drops inline lot fields).
-- - Renames goods_receipt_batch_items → goods_receipt_line_items.
-- - Adds goods_receipt_lots (lot info entered once, FK to items).
--
-- No backwards compatibility: TRUNCATE existing GR transactional data first.
--
-- Inventory ledger entries that referenced goods_receipts via reference_type='GOODS_RECEIPT'
-- are also wiped (no real production data yet).

BEGIN;

-- 1. Wipe existing GR transactional data (no backwards compat, matching SA approach)
TRUNCATE TABLE
  vritti_core.goods_receipt_batch_items,
  vritti_core.goods_receipt_batches,
  vritti_core.goods_receipt_items,
  vritti_core.goods_receipts
RESTART IDENTITY CASCADE;

-- Wipe inventory_ledger entries that reference goods receipts (no production data yet)
DELETE FROM vritti_core.inventory_ledger WHERE reference_type = 'GOODS_RECEIPT';

-- 2. Drop the old batches/batch_items tables
DROP TABLE IF EXISTS vritti_core.goods_receipt_batch_items CASCADE;
DROP TABLE IF EXISTS vritti_core.goods_receipt_batches CASCADE;

-- 3. Reshape goods_receipts: add metadata, narrow status enum
-- The existing enum has 'ALLOCATION_PENDING' which is being removed. Since we truncated
-- the table, we can recreate the enum cleanly.
ALTER TYPE vritti_core.goods_receipt_status RENAME TO goods_receipt_status_old;
CREATE TYPE vritti_core.goods_receipt_status AS ENUM ('DRAFT', 'PUBLISHED');
ALTER TABLE vritti_core.goods_receipts
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE vritti_core.goods_receipt_status USING status::text::vritti_core.goods_receipt_status,
  ALTER COLUMN status SET DEFAULT 'DRAFT';
DROP TYPE vritti_core.goods_receipt_status_old;

ALTER TABLE vritti_core.goods_receipts
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

-- 4. Reshape goods_receipt_items: drop accepted_quantity, add metadata, add unique
ALTER TABLE vritti_core.goods_receipt_items
  DROP COLUMN IF EXISTS accepted_quantity,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

ALTER TABLE vritti_core.goods_receipt_items
  DROP CONSTRAINT IF EXISTS uq_goods_receipt_items_gr_item;
ALTER TABLE vritti_core.goods_receipt_items
  ADD CONSTRAINT uq_goods_receipt_items_gr_item UNIQUE (goods_receipt_id, inventory_item_id);

-- 5. Create goods_receipt_lots
CREATE TABLE vritti_core.goods_receipt_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT current_setting('app.org_id')::uuid,
  business_unit_id uuid NOT NULL DEFAULT current_setting('app.bu_id')::uuid,
  goods_receipt_item_id uuid NOT NULL REFERENCES vritti_core.goods_receipt_items(id) ON DELETE CASCADE,
  lot_number varchar(100) NOT NULL,
  manufacturing_date timestamptz,
  expiry_date timestamptz,
  resolved_lot_id uuid REFERENCES vritti_core.inventory_item_lots(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_goods_receipt_lots_item_lot UNIQUE (goods_receipt_item_id, lot_number)
);
CREATE INDEX idx_goods_receipt_lots_item ON vritti_core.goods_receipt_lots (goods_receipt_item_id);
CREATE INDEX idx_goods_receipt_lots_resolved ON vritti_core.goods_receipt_lots (resolved_lot_id);

ALTER TABLE vritti_core.goods_receipt_lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON vritti_core.goods_receipt_lots
  USING (organization_id = (current_setting('app.org_id', true))::uuid);
CREATE POLICY bu_ancestor_read ON vritti_core.goods_receipt_lots FOR SELECT
  USING (business_unit_id = ANY ((current_setting('app.bu_ancestor_ids', true))::uuid[]));
CREATE POLICY bu_write ON vritti_core.goods_receipt_lots FOR INSERT
  WITH CHECK (business_unit_id = (current_setting('app.bu_id', true))::uuid);
CREATE POLICY bu_update ON vritti_core.goods_receipt_lots FOR UPDATE
  USING (business_unit_id = (current_setting('app.bu_id', true))::uuid);
CREATE POLICY bu_delete ON vritti_core.goods_receipt_lots FOR DELETE
  USING (business_unit_id = (current_setting('app.bu_id', true))::uuid);

-- 6. Create goods_receipt_lines (replaces goods_receipt_batches)
CREATE TABLE vritti_core.goods_receipt_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT current_setting('app.org_id')::uuid,
  business_unit_id uuid NOT NULL DEFAULT current_setting('app.bu_id')::uuid,
  goods_receipt_item_id uuid NOT NULL REFERENCES vritti_core.goods_receipt_items(id) ON DELETE CASCADE,
  goods_receipt_lot_id uuid REFERENCES vritti_core.goods_receipt_lots(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES vritti_core.storage_locations(id),
  quantity numeric(12, 3) NOT NULL,
  resolved_quant_id uuid REFERENCES vritti_core.inventory_item_quants(id) ON DELETE SET NULL,
  is_balanced boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_goods_receipt_lines_item ON vritti_core.goods_receipt_lines (goods_receipt_item_id);
CREATE INDEX idx_goods_receipt_lines_lot ON vritti_core.goods_receipt_lines (goods_receipt_lot_id);
CREATE INDEX idx_goods_receipt_lines_location ON vritti_core.goods_receipt_lines (location_id);
CREATE INDEX idx_goods_receipt_lines_resolved ON vritti_core.goods_receipt_lines (resolved_quant_id);

ALTER TABLE vritti_core.goods_receipt_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON vritti_core.goods_receipt_lines
  USING (organization_id = (current_setting('app.org_id', true))::uuid);
CREATE POLICY bu_ancestor_read ON vritti_core.goods_receipt_lines FOR SELECT
  USING (business_unit_id = ANY ((current_setting('app.bu_ancestor_ids', true))::uuid[]));
CREATE POLICY bu_write ON vritti_core.goods_receipt_lines FOR INSERT
  WITH CHECK (business_unit_id = (current_setting('app.bu_id', true))::uuid);
CREATE POLICY bu_update ON vritti_core.goods_receipt_lines FOR UPDATE
  USING (business_unit_id = (current_setting('app.bu_id', true))::uuid);
CREATE POLICY bu_delete ON vritti_core.goods_receipt_lines FOR DELETE
  USING (business_unit_id = (current_setting('app.bu_id', true))::uuid);

-- 7. Create goods_receipt_line_items (replaces goods_receipt_batch_items)
CREATE TABLE vritti_core.goods_receipt_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT current_setting('app.org_id')::uuid,
  business_unit_id uuid NOT NULL DEFAULT current_setting('app.bu_id')::uuid,
  goods_receipt_line_id uuid NOT NULL REFERENCES vritti_core.goods_receipt_lines(id) ON DELETE CASCADE,
  serial_number varchar(100) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_goods_receipt_line_items_line_serial UNIQUE (goods_receipt_line_id, serial_number)
);
CREATE INDEX idx_goods_receipt_line_items_line ON vritti_core.goods_receipt_line_items (goods_receipt_line_id);

ALTER TABLE vritti_core.goods_receipt_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON vritti_core.goods_receipt_line_items
  USING (organization_id = (current_setting('app.org_id', true))::uuid);
CREATE POLICY bu_ancestor_read ON vritti_core.goods_receipt_line_items FOR SELECT
  USING (business_unit_id = ANY ((current_setting('app.bu_ancestor_ids', true))::uuid[]));
CREATE POLICY bu_write ON vritti_core.goods_receipt_line_items FOR INSERT
  WITH CHECK (business_unit_id = (current_setting('app.bu_id', true))::uuid);
CREATE POLICY bu_update ON vritti_core.goods_receipt_line_items FOR UPDATE
  USING (business_unit_id = (current_setting('app.bu_id', true))::uuid);
CREATE POLICY bu_delete ON vritti_core.goods_receipt_line_items FOR DELETE
  USING (business_unit_id = (current_setting('app.bu_id', true))::uuid);

COMMIT;
