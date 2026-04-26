-- Inventory tracking type migration
-- Introduces tracking enum (none/lot/item), inventory_item_lots first-class entity,
-- repurposes inventory_item_quant_items as a serial-number registry,
-- and reshapes stock-adjustment + goods-receipt schemas accordingly.
-- Note: clears all inventory-related transactional data — no backward compatibility.

BEGIN;

-- ============================================================================
-- 1. Wipe inventory-related transactional data (we're not preserving old data)
-- ============================================================================
TRUNCATE TABLE
  vritti_core.inventory_ledger,
  vritti_core.stock_adjustment_line_items,
  vritti_core.stock_adjustment_lines,
  vritti_core.stock_adjustments,
  vritti_core.goods_receipt_batch_items,
  vritti_core.goods_receipt_batches,
  vritti_core.goods_receipt_items,
  vritti_core.goods_receipts,
  vritti_core.conversion_inputs,
  vritti_core.conversion_outputs,
  vritti_core.conversions,
  vritti_core.stock_transfers,
  vritti_core.inventory_item_batch_items,
  vritti_core.inventory_item_quants
RESTART IDENTITY CASCADE;

-- Clear PO received_quantity since the receipts that incremented it are gone
UPDATE vritti_core.purchase_order_items SET received_quantity = 0;

-- ============================================================================
-- 2. New enums
-- ============================================================================
CREATE TYPE vritti_core.inventory_tracking AS ENUM ('none', 'lot', 'item');
CREATE TYPE vritti_core.quant_item_status AS ENUM ('AVAILABLE', 'RESERVED', 'CONSUMED');

-- ============================================================================
-- 3. inventory_items: add `tracking` column
-- ============================================================================
ALTER TABLE vritti_core.inventory_items
  ADD COLUMN tracking vritti_core.inventory_tracking NOT NULL DEFAULT 'lot';

-- ============================================================================
-- 4. inventory_item_lots: new table
-- ============================================================================
CREATE TABLE vritti_core.inventory_item_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT current_setting('app.org_id')::uuid,
  business_unit_id uuid NOT NULL DEFAULT current_setting('app.bu_id')::uuid,
  inventory_item_id uuid NOT NULL REFERENCES vritti_core.inventory_items(id) ON DELETE CASCADE,
  lot_number varchar(100) NOT NULL,
  manufacturing_date timestamptz,
  expiry_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_inventory_item_lots_org_item_number UNIQUE (organization_id, inventory_item_id, lot_number)
);

CREATE INDEX idx_inventory_item_lots_item ON vritti_core.inventory_item_lots (inventory_item_id);
CREATE INDEX idx_inventory_item_lots_expiry ON vritti_core.inventory_item_lots (expiry_date);

ALTER TABLE vritti_core.inventory_item_lots ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON vritti_core.inventory_item_lots
  FOR ALL USING (organization_id = current_setting('app.org_id', true)::uuid);

CREATE POLICY bu_ancestor_read ON vritti_core.inventory_item_lots
  FOR SELECT USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));

CREATE POLICY bu_write ON vritti_core.inventory_item_lots
  FOR INSERT WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);

CREATE POLICY bu_update ON vritti_core.inventory_item_lots
  FOR UPDATE USING (business_unit_id = current_setting('app.bu_id', true)::uuid);

CREATE POLICY bu_delete ON vritti_core.inventory_item_lots
  FOR DELETE USING (business_unit_id = current_setting('app.bu_id', true)::uuid);

-- ============================================================================
-- 5. inventory_item_quants: drop legacy lot fields, add lot_id
-- ============================================================================
ALTER TABLE vritti_core.inventory_item_quants
  DROP CONSTRAINT IF EXISTS uq_inventory_item_batches_org_batch_number;

DROP INDEX IF EXISTS vritti_core.idx_inventory_item_batches_expiry;

ALTER TABLE vritti_core.inventory_item_quants
  DROP COLUMN batch_number,
  DROP COLUMN manufacturing_date,
  DROP COLUMN expiry_date,
  DROP COLUMN goods_receipt_item_id;

ALTER TABLE vritti_core.inventory_item_quants
  ADD COLUMN lot_id uuid REFERENCES vritti_core.inventory_item_lots(id) ON DELETE RESTRICT;

CREATE INDEX idx_inventory_item_quants_lot ON vritti_core.inventory_item_quants (lot_id);

-- ============================================================================
-- 6. inventory_item_quant_items: rename + repurpose as serial registry
-- ============================================================================
ALTER TABLE vritti_core.inventory_item_batch_items
  RENAME TO inventory_item_quant_items;

ALTER TABLE vritti_core.inventory_item_quant_items
  RENAME COLUMN inventory_item_batch_id TO inventory_item_quant_id;

ALTER TABLE vritti_core.inventory_item_quant_items
  DROP CONSTRAINT IF EXISTS uq_inventory_batch_items_batch_item;

DROP INDEX IF EXISTS vritti_core.idx_inventory_batch_items_batch;
DROP INDEX IF EXISTS vritti_core.idx_inventory_batch_items_item;

ALTER TABLE vritti_core.inventory_item_quant_items
  DROP COLUMN quantity,
  DROP COLUMN reserved_quantity;

ALTER TABLE vritti_core.inventory_item_quant_items
  ADD COLUMN serial_number varchar(100) NOT NULL,
  ADD COLUMN status vritti_core.quant_item_status NOT NULL DEFAULT 'AVAILABLE';

CREATE UNIQUE INDEX uq_inventory_quant_items_serial
  ON vritti_core.inventory_item_quant_items (organization_id, inventory_item_id, serial_number);

CREATE INDEX idx_inventory_quant_items_quant
  ON vritti_core.inventory_item_quant_items (inventory_item_quant_id);

CREATE INDEX idx_inventory_quant_items_item
  ON vritti_core.inventory_item_quant_items (inventory_item_id);

CREATE INDEX idx_inventory_quant_items_quant_status
  ON vritti_core.inventory_item_quant_items (inventory_item_quant_id, status);

-- ============================================================================
-- 7. stock_adjustment_lines: drop batch_number, add lot_number
-- ============================================================================
ALTER TABLE vritti_core.stock_adjustment_lines
  DROP COLUMN batch_number,
  ADD COLUMN lot_number varchar(100);

-- Convert manufacturing/expiry to timestamptz to match new schema (they were `date` before)
ALTER TABLE vritti_core.stock_adjustment_lines
  ALTER COLUMN manufacturing_date TYPE timestamptz USING manufacturing_date::timestamptz,
  ALTER COLUMN expiry_date TYPE timestamptz USING expiry_date::timestamptz;

-- ============================================================================
-- 8. stock_adjustment_line_items: drop quantity, add quant_item_id + serial_number
-- ============================================================================
ALTER TABLE vritti_core.stock_adjustment_line_items
  DROP COLUMN quantity;

ALTER TABLE vritti_core.stock_adjustment_line_items
  ADD COLUMN quant_item_id uuid REFERENCES vritti_core.inventory_item_quant_items(id) ON DELETE RESTRICT,
  ADD COLUMN serial_number varchar(100);

CREATE INDEX idx_sa_line_items_quant_item
  ON vritti_core.stock_adjustment_line_items (quant_item_id);

-- ============================================================================
-- 9. goods_receipt_batches: add lot_number
-- ============================================================================
ALTER TABLE vritti_core.goods_receipt_batches
  ADD COLUMN lot_number varchar(100);

-- ============================================================================
-- 10. goods_receipt_batch_items: drop quantity, add serial_number (NOT NULL)
-- ============================================================================
ALTER TABLE vritti_core.goods_receipt_batch_items
  DROP COLUMN quantity;

ALTER TABLE vritti_core.goods_receipt_batch_items
  ADD COLUMN serial_number varchar(100) NOT NULL;

-- ============================================================================
-- 11. Drop the legacy batch-number sequence
-- ============================================================================
DROP SEQUENCE IF EXISTS vritti_core.inventory_item_quant_number_seq;

COMMIT;
