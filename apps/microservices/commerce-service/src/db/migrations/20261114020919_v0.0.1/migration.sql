ALTER TABLE "commerce"."inventory_item_ledger" ALTER COLUMN "legal_entity_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_locations" ALTER COLUMN "legal_entity_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_quants" ALTER COLUMN "legal_entity_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."locations" ALTER COLUMN "legal_entity_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."stock_adjustments" ALTER COLUMN "legal_entity_id" SET NOT NULL;