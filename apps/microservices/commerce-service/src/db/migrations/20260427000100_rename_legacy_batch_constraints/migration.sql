-- Rename legacy "batch" constraint and index names to match the new "quants/quant_items" schema.
-- The objects function correctly with old names; this aligns them with what Drizzle expects.

BEGIN;

-- ============================================================================
-- inventory_item_quants — was inventory_item_batches
-- ============================================================================
ALTER INDEX vritti_core.inventory_item_batches_pkey RENAME TO inventory_item_quants_pkey;
ALTER INDEX vritti_core.idx_inventory_item_batches_item RENAME TO idx_inventory_item_quants_item;
ALTER INDEX vritti_core.idx_inventory_item_batches_location RENAME TO idx_inventory_item_quants_location;
ALTER INDEX vritti_core.idx_inventory_item_batches_item_location RENAME TO idx_inventory_item_quants_item_location;

ALTER TABLE vritti_core.inventory_item_quants
  RENAME CONSTRAINT "inventory_item_batches_IizScUrOf6zq_fkey" TO inventory_item_quants_inventory_item_id_fkey;
ALTER TABLE vritti_core.inventory_item_quants
  RENAME CONSTRAINT inventory_item_batches_location_id_storage_locations_id_fkey TO inventory_item_quants_location_id_fkey;

-- ============================================================================
-- inventory_item_quant_items — was inventory_item_batch_items
-- ============================================================================
ALTER INDEX vritti_core.inventory_item_batch_items_pkey RENAME TO inventory_item_quant_items_pkey;

ALTER TABLE vritti_core.inventory_item_quant_items
  RENAME CONSTRAINT inventory_item_batch_items_inventory_item_batch_id_fkey TO inventory_item_quant_items_inventory_item_quant_id_fkey;
ALTER TABLE vritti_core.inventory_item_quant_items
  RENAME CONSTRAINT inventory_item_batch_items_inventory_item_id_fkey TO inventory_item_quant_items_inventory_item_id_fkey;

COMMIT;
