ALTER TABLE "vritti_core"."inventory_items" DROP CONSTRAINT "inventory_items_mrp_uom_id_uom_id_fkey";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_mrps" DROP CONSTRAINT "uq_inventory_item_mrps_item_currency";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_mrps" ADD COLUMN "uom_id" uuid;--> statement-breakpoint
UPDATE "vritti_core"."inventory_item_mrps" m SET "uom_id" = i."uom_id" FROM "vritti_core"."inventory_items" i WHERE m."inventory_item_id" = i."id" AND m."uom_id" IS NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_mrps" ALTER COLUMN "uom_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" DROP COLUMN "mrp_uom_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_mrps" ADD CONSTRAINT "uq_inventory_item_mrps_item_uom_currency" UNIQUE("inventory_item_id","uom_id","currency_code");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_mrps_uom" ON "vritti_core"."inventory_item_mrps" ("uom_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_mrps" ADD CONSTRAINT "inventory_item_mrps_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "vritti_core"."uom"("id");
