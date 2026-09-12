ALTER TABLE "commerce"."inventory_items" RENAME COLUMN "code" TO "sku";--> statement-breakpoint
ALTER TABLE "commerce"."inventory_items" RENAME CONSTRAINT "inventory_items_code_chk" TO "inventory_items_sku_chk";--> statement-breakpoint
ALTER INDEX "commerce"."idx_inventory_items_code_sort" RENAME TO "idx_inventory_items_sku_sort";--> statement-breakpoint
ALTER TABLE "commerce"."inventory_items" RENAME CONSTRAINT "uq_inventory_items_org_code" TO "uq_inventory_items_org_sku";--> statement-breakpoint
ALTER TABLE "commerce"."inventory_items" DROP CONSTRAINT "inventory_items_sku_chk", ADD CONSTRAINT "inventory_items_sku_chk" CHECK ("sku" ~ '^[a-z0-9][a-z0-9-]*$');