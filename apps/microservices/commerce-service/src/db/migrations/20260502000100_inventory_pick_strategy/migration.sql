BEGIN;
CREATE TYPE vritti_core.inventory_pick_strategy AS ENUM ('none', 'fifo', 'fefo');
ALTER TABLE vritti_core.inventory_items
  ADD COLUMN pick_strategy vritti_core.inventory_pick_strategy NOT NULL DEFAULT 'none';
COMMIT;
