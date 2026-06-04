ALTER TABLE "vritti_core"."purchase_order_items" DROP CONSTRAINT IF EXISTS "uq_purchase_order_items_po_item";--> statement-breakpoint
DROP INDEX IF EXISTS "vritti_core"."uq_supplier_items_supplier_item";--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_order_items" ADD CONSTRAINT "uq_purchase_order_items_po_item_uom" UNIQUE("purchase_order_id","inventory_item_id","uom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_items_supplier_item_uom" ON "vritti_core"."supplier_items" ("supplier_id","inventory_item_id","uom_id");