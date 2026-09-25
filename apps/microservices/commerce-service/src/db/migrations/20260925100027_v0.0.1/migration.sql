ALTER TABLE "commerce"."catalog_listings" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "commerce"."offering_variants" ALTER COLUMN "combination_key" SET NOT NULL;