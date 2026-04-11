ALTER TABLE IF EXISTS "vritti_core"."inventory_batches" RENAME TO "inventory_item_batches";--> statement-breakpoint
ALTER INDEX IF EXISTS "vritti_core"."idx_inventory_batches_item" RENAME TO "idx_inventory_item_batches_item";--> statement-breakpoint
ALTER INDEX IF EXISTS "vritti_core"."idx_inventory_batches_location" RENAME TO "idx_inventory_item_batches_location";--> statement-breakpoint
ALTER INDEX IF EXISTS "vritti_core"."idx_inventory_batches_item_location" RENAME TO "idx_inventory_item_batches_item_location";--> statement-breakpoint
ALTER INDEX IF EXISTS "vritti_core"."idx_inventory_batches_expiry" RENAME TO "idx_inventory_item_batches_expiry";--> statement-breakpoint
DROP VIEW IF EXISTS "vritti_core"."inventory_levels";--> statement-breakpoint
CREATE VIEW "vritti_core"."inventory_levels" AS
  SELECT b.inventory_item_id, b.location_id,
    CAST(SUM(b.quantity) AS TEXT) AS stocked_quantity,
    CAST(SUM(b.reserved_quantity) AS TEXT) AS reserved_quantity,
    CAST(SUM(b.quantity - b.reserved_quantity) AS TEXT) AS available_quantity,
    c.reorder_level
  FROM "vritti_core"."inventory_item_batches" b
  LEFT JOIN "vritti_core"."storage_location_configs" c
    ON b.inventory_item_id = c.inventory_item_id AND b.location_id = c.location_id
  GROUP BY b.inventory_item_id, b.location_id, c.reorder_level;
