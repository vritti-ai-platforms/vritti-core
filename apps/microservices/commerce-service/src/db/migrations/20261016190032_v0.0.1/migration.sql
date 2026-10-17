ALTER TABLE "commerce"."cart_items" DROP CONSTRAINT "cart_items_offering_variant_id_offering_variants_id_fkey";--> statement-breakpoint
ALTER TABLE "commerce"."wishlist_items" DROP CONSTRAINT "wishlist_items_offering_variant_id_offering_variants_id_fkey";--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" DROP COLUMN "offering_variant_id";--> statement-breakpoint
ALTER TABLE "commerce"."wishlist_items" DROP COLUMN "offering_variant_id";