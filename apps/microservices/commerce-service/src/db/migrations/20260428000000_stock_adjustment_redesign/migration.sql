-- Stock adjustment redesign migration
-- Introduces stock_adjustment_lots as a first-class lot intent table,
-- reshapes stock_adjustment_lines (drops inline lot fields, adds FK to lots, CHECK on intent),
-- reshapes stock_adjustment_line_items as a serial registry,
-- drops stock_adjustments.quantity (now derived from lines), adds metadata jsonb.
-- Note: clears all SA + ledger transactional data — no backward compatibility.

BEGIN;

-- ============================================================================
-- 0. Wipe SA-related transactional data (per "forget old data")
--    Inventory entities (items/lots/quants/quant_items) are kept; only
--    references from ledger and the SA drafts go away.
-- ============================================================================
TRUNCATE TABLE
  vritti_core.inventory_ledger,
  vritti_core.stock_adjustment_line_items,
  vritti_core.stock_adjustment_lines,
  vritti_core.stock_adjustments
RESTART IDENTITY CASCADE;

-- ============================================================================
-- 1. stock_adjustments — drop quantity, add metadata
-- ============================================================================
ALTER TABLE vritti_core.stock_adjustments DROP COLUMN quantity;
ALTER TABLE vritti_core.stock_adjustments ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}';

-- ============================================================================
-- 2. stock_adjustment_lots — NEW table (lot intent within an adjustment)
-- ============================================================================
CREATE TABLE vritti_core.stock_adjustment_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT current_setting('app.org_id')::uuid,
  business_unit_id uuid NOT NULL DEFAULT current_setting('app.bu_id')::uuid,
  stock_adjustment_id uuid NOT NULL REFERENCES vritti_core.stock_adjustments(id) ON DELETE CASCADE,
  lot_number varchar(100) NOT NULL,
  manufacturing_date timestamptz,
  expiry_date timestamptz,
  resolved_lot_id uuid REFERENCES vritti_core.inventory_item_lots(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_stock_adjustment_lots_adj_lot UNIQUE (stock_adjustment_id, lot_number)
);

CREATE INDEX idx_stock_adjustment_lots_adj ON vritti_core.stock_adjustment_lots (stock_adjustment_id);
CREATE INDEX idx_stock_adjustment_lots_resolved ON vritti_core.stock_adjustment_lots (resolved_lot_id);

ALTER TABLE vritti_core.stock_adjustment_lots ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON vritti_core.stock_adjustment_lots
  FOR ALL USING (organization_id = current_setting('app.org_id', true)::uuid);

CREATE POLICY bu_ancestor_read ON vritti_core.stock_adjustment_lots
  FOR SELECT USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));

CREATE POLICY bu_write ON vritti_core.stock_adjustment_lots
  FOR INSERT WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);

CREATE POLICY bu_update ON vritti_core.stock_adjustment_lots
  FOR UPDATE USING (business_unit_id = current_setting('app.bu_id', true)::uuid);

CREATE POLICY bu_delete ON vritti_core.stock_adjustment_lots
  FOR DELETE USING (business_unit_id = current_setting('app.bu_id', true)::uuid);

-- ============================================================================
-- 3. stock_adjustment_lines — reshape
--    Drop: lot_number, manufacturing_date, expiry_date, is_balanced (recreated with new default)
--    Rename: batch_id → quant_id
--    Add: stock_adjustment_lot_id, resolved_quant_id, is_balanced (default true), metadata
--    CHECK: location_id XOR quant_id must be set
-- ============================================================================
ALTER TABLE vritti_core.stock_adjustment_lines
  DROP COLUMN lot_number,
  DROP COLUMN manufacturing_date,
  DROP COLUMN expiry_date,
  DROP COLUMN is_balanced;

ALTER TABLE vritti_core.stock_adjustment_lines RENAME COLUMN batch_id TO quant_id;

-- The existing FK constraint on the renamed column has the legacy name; rename it for clarity
ALTER TABLE vritti_core.stock_adjustment_lines
  RENAME CONSTRAINT stock_adjustment_lines_batch_id_inventory_item_batches_id_fkey
  TO stock_adjustment_lines_quant_id_inventory_item_quants_id_fkey;

ALTER INDEX vritti_core.idx_stock_adjustment_lines_batch RENAME TO idx_stock_adjustment_lines_quant;

ALTER TABLE vritti_core.stock_adjustment_lines
  ADD COLUMN stock_adjustment_lot_id uuid REFERENCES vritti_core.stock_adjustment_lots(id) ON DELETE CASCADE,
  ADD COLUMN resolved_quant_id uuid REFERENCES vritti_core.inventory_item_quants(id) ON DELETE SET NULL,
  ADD COLUMN is_balanced boolean NOT NULL DEFAULT true,
  ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}';

CREATE INDEX idx_stock_adjustment_lines_lot ON vritti_core.stock_adjustment_lines (stock_adjustment_lot_id);
CREATE INDEX idx_stock_adjustment_lines_resolved ON vritti_core.stock_adjustment_lines (resolved_quant_id);

ALTER TABLE vritti_core.stock_adjustment_lines
  ADD CONSTRAINT chk_line_intent CHECK (
    (location_id IS NOT NULL AND quant_id IS NULL)
    OR
    (location_id IS NULL AND quant_id IS NOT NULL)
  );

-- ============================================================================
-- 4. stock_adjustment_line_items — reshape as serial registry
--    Drop: quantity (already dropped in earlier migration), quant_item_id (resolved at publish from serial_number)
--    Make: serial_number NOT NULL
--    Add: metadata
--    Add: unique (stock_adjustment_line_id, serial_number)
-- ============================================================================
ALTER TABLE vritti_core.stock_adjustment_line_items
  DROP COLUMN IF EXISTS quantity,
  DROP COLUMN quant_item_id;

ALTER TABLE vritti_core.stock_adjustment_line_items
  ALTER COLUMN serial_number SET NOT NULL;

ALTER TABLE vritti_core.stock_adjustment_line_items
  ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}';

ALTER TABLE vritti_core.stock_adjustment_line_items
  ADD CONSTRAINT uq_stock_adjustment_line_items_line_serial UNIQUE (stock_adjustment_line_id, serial_number);

DROP INDEX IF EXISTS vritti_core.idx_sa_line_items_quant_item;

COMMIT;
