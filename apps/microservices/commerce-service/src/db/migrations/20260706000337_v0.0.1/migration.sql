CREATE INDEX "idx_inventory_items_feed" ON "vritti_core"."inventory_items" ("organization_id","created_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "idx_inventory_items_name" ON "vritti_core"."inventory_items" ("organization_id","name","id");--> statement-breakpoint
CREATE INDEX "idx_inventory_items_code_sort" ON "vritti_core"."inventory_items" ("organization_id","code","id");