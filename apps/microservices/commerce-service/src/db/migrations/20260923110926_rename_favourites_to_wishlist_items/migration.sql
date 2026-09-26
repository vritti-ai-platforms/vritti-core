ALTER TABLE "commerce"."favourites" RENAME TO "wishlist_items";--> statement-breakpoint
ALTER INDEX "commerce"."idx_favourites_party" RENAME TO "idx_wishlist_items_party";--> statement-breakpoint
ALTER TABLE "commerce"."wishlist_items" RENAME CONSTRAINT "uq_favourites_party_listing" TO "uq_wishlist_items_party_listing";