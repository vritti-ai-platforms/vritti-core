ALTER TABLE "commerce"."offering_variants" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "commerce"."order_items" DROP COLUMN "item_name";--> statement-breakpoint
ALTER TABLE "commerce"."order_items" DROP COLUMN "variant_name";--> statement-breakpoint
ALTER TABLE "commerce"."order_items" ALTER COLUMN "name" SET NOT NULL;