ALTER TABLE IF EXISTS "vritti_core"."inventory_item_location_config" RENAME TO "storage_location_configs";--> statement-breakpoint
ALTER INDEX IF EXISTS "vritti_core"."uq_item_location_config" RENAME TO "uq_storage_location_configs";--> statement-breakpoint
ALTER INDEX IF EXISTS "vritti_core"."idx_item_location_config_item" RENAME TO "idx_storage_location_configs_item";--> statement-breakpoint
ALTER INDEX IF EXISTS "vritti_core"."idx_item_location_config_location" RENAME TO "idx_storage_location_configs_location";--> statement-breakpoint
DROP VIEW IF EXISTS "vritti_core"."inventory_levels";--> statement-breakpoint
CREATE VIEW "vritti_core"."inventory_levels" AS
  SELECT b.inventory_item_id, b.location_id,
    CAST(SUM(b.quantity) AS TEXT) AS stocked_quantity,
    CAST(SUM(b.reserved_quantity) AS TEXT) AS reserved_quantity,
    CAST(SUM(b.quantity - b.reserved_quantity) AS TEXT) AS available_quantity,
    c.reorder_level
  FROM "vritti_core"."inventory_batches" b
  LEFT JOIN "vritti_core"."storage_location_configs" c
    ON b.inventory_item_id = c.inventory_item_id AND b.location_id = c.location_id
  GROUP BY b.inventory_item_id, b.location_id, c.reorder_level;
