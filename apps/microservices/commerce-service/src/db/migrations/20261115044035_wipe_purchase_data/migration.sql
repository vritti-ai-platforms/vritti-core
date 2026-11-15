-- Custom SQL migration file, put your code below! --
DELETE FROM "commerce"."purchase_events";
--> statement-breakpoint
DELETE FROM "commerce"."purchase_item_allocations";
--> statement-breakpoint
DELETE FROM "commerce"."purchase_suppliers";
--> statement-breakpoint
DELETE FROM "commerce"."supplier_quotations" WHERE "purchase_id" IS NOT NULL;
--> statement-breakpoint
DELETE FROM "commerce"."purchase_items";
--> statement-breakpoint
DELETE FROM "commerce"."purchases";
