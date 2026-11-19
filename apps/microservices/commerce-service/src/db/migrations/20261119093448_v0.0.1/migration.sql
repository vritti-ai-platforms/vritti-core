ALTER TABLE "commerce"."inventory_items" ADD COLUMN "display_uom_id" uuid;--> statement-breakpoint
CREATE INDEX "idx_inventory_items_display_uom" ON "commerce"."inventory_items" ("display_uom_id");--> statement-breakpoint
ALTER TABLE "commerce"."inventory_items" ADD CONSTRAINT "inventory_items_display_uom_id_uom_id_fkey" FOREIGN KEY ("display_uom_id") REFERENCES "commerce"."uom"("id");