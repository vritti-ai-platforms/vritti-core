-- Split inventory_tracking 'serial' into two distinct values:
--   'lot_serial' (was 'serial') — serial numbers within a lot
--   'serial'                    — standalone serial numbers (no lot)
--
-- Note: ALTER TYPE ... ADD VALUE cannot run inside the same transaction that
-- subsequently uses the new value. Split into two atomic statements.

ALTER TYPE vritti_core.inventory_tracking RENAME VALUE 'serial' TO 'lot_serial';

ALTER TYPE vritti_core.inventory_tracking ADD VALUE 'serial';
