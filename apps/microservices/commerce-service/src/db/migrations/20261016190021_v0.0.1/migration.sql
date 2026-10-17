ALTER TABLE "commerce"."cart_items" ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."wishlist_items" ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" DROP CONSTRAINT "uq_cart_items_cart_variant";--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" ADD CONSTRAINT "uq_cart_items_cart_variant" UNIQUE("cart_id","code");--> statement-breakpoint
ALTER TABLE "commerce"."wishlist_items" DROP CONSTRAINT "uq_wishlist_items_party_variant";--> statement-breakpoint
ALTER TABLE "commerce"."wishlist_items" ADD CONSTRAINT "uq_wishlist_items_party_variant" UNIQUE("organization_id","app_id","party_id","code");--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" ADD CONSTRAINT "fk_cart_items_variant_code" FOREIGN KEY ("organization_id","code") REFERENCES "commerce"."offering_variants"("organization_id","code") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."wishlist_items" ADD CONSTRAINT "fk_wishlist_items_variant_code" FOREIGN KEY ("organization_id","code") REFERENCES "commerce"."offering_variants"("organization_id","code") ON DELETE CASCADE;