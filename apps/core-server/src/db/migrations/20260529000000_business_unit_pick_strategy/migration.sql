-- BU-level default pick strategy (FEFO / FIFO / LIFO) used by commerce-service when removing stock.
-- Item-level inventory_items.pick_strategy ('none' / 'fifo' / 'fefo') can override per item;
-- this column gives the BU's fallback when the item carries 'none'. Defaults to FEFO since most
-- pharmacy / perishable inventories prefer expiry-driven picking.

CREATE TYPE "vritti_core"."pick_strategy" AS ENUM ('FEFO', 'FIFO', 'LIFO');--> statement-breakpoint

ALTER TABLE "vritti_core"."business_units"
  ADD COLUMN "pick_strategy" "vritti_core"."pick_strategy" NOT NULL DEFAULT 'FEFO';
