DROP POLICY "site_read" ON "vritti_core"."inventory_item_uom_conversions";--> statement-breakpoint
DROP POLICY "site_write" ON "vritti_core"."inventory_item_uom_conversions";--> statement-breakpoint
DROP POLICY "site_update" ON "vritti_core"."inventory_item_uom_conversions";--> statement-breakpoint
DROP POLICY "site_delete" ON "vritti_core"."inventory_item_uom_conversions";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_iiuc_site";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" DROP COLUMN "site_id";