ALTER TABLE "vritti_core"."inventory_item_quant_items" RENAME TO "inventory_item_serials";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_serials" DROP CONSTRAINT "inventory_item_quant_items_Pta81RKh7j4w_fkey";--> statement-breakpoint
ALTER INDEX "vritti_core"."idx_inventory_quant_items_quant" RENAME TO "idx_inventory_item_serials_quant";--> statement-breakpoint
DROP INDEX "idx_inventory_quant_items_item";--> statement-breakpoint
DROP INDEX "idx_inventory_quant_items_quant_status";--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_order_items" ADD COLUMN "item_currency_code" varchar(3) NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_order_items" ADD COLUMN "conversion_rate" numeric(18,6) DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_serials" ALTER COLUMN "inventory_item_quant_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_serials" RENAME CONSTRAINT "uq_inventory_quant_items_serial" TO "uq_inventory_item_serials_serial";--> statement-breakpoint
CREATE INDEX "idx_inventory_item_serials_item" ON "vritti_core"."inventory_item_serials" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_serials_quant_status" ON "vritti_core"."inventory_item_serials" ("inventory_item_quant_id","status");--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_serials" ADD CONSTRAINT "inventory_item_serials_s63VhASWzVvD_fkey" FOREIGN KEY ("inventory_item_quant_id") REFERENCES "vritti_core"."inventory_item_quants"("id") ON DELETE SET NULL;