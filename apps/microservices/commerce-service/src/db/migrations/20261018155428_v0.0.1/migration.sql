ALTER TABLE "commerce"."offering_variants" ADD COLUMN "dimensions" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."offering_variants" ADD COLUMN "attributes" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."order_items" ADD COLUMN "name" varchar(500);