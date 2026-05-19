-- Rename table: inventory_item_quant_items -> inventory_item_serials
ALTER TABLE "vritti_core"."inventory_item_quant_items" RENAME TO "inventory_item_serials";

-- Rename unique constraint
ALTER TABLE "vritti_core"."inventory_item_serials" RENAME CONSTRAINT "uq_inventory_quant_items_serial" TO "uq_inventory_item_serials_serial";

-- Rename indexes
ALTER INDEX "vritti_core"."idx_inventory_quant_items_quant" RENAME TO "idx_inventory_item_serials_quant";
ALTER INDEX "vritti_core"."idx_inventory_quant_items_item" RENAME TO "idx_inventory_item_serials_item";
ALTER INDEX "vritti_core"."idx_inventory_quant_items_quant_status" RENAME TO "idx_inventory_item_serials_quant_status";

-- Make inventory_item_quant_id nullable (was NOT NULL)
ALTER TABLE "vritti_core"."inventory_item_serials" ALTER COLUMN "inventory_item_quant_id" DROP NOT NULL;

-- Drop old FK with cascade and re-add with set null
ALTER TABLE "vritti_core"."inventory_item_serials" DROP CONSTRAINT "inventory_item_quant_items_Pta81RKh7j4w_fkey";
ALTER TABLE "vritti_core"."inventory_item_serials" ADD CONSTRAINT "inventory_item_serials_inventory_item_quant_id_inventory_item_quants_id_fkey" FOREIGN KEY ("inventory_item_quant_id") REFERENCES "vritti_core"."inventory_item_quants"("id") ON DELETE SET NULL;
