-- Rename inventory_tracking enum values for clarity:
--   'none' -> 'quantity'  (we still track quantity, just not at lot/serial granularity)
--   'item' -> 'serial'    ('item' collided with the inventory_items entity name)

BEGIN;

ALTER TYPE vritti_core.inventory_tracking RENAME VALUE 'none' TO 'quantity';
ALTER TYPE vritti_core.inventory_tracking RENAME VALUE 'item' TO 'serial';

COMMIT;
