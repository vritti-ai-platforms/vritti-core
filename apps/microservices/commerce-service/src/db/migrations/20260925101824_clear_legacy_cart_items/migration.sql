-- Empties the flat basket table ahead of the reshape that gives it a parent.
--
-- Every existing line is keyed to a catalog listing and addressed by app and party, with no basket
-- row to belong to. The next migration adds `cart_id` and `offering_variant_id` as NOT NULL, which
-- no surviving row could satisfy: there is no basket to point at, and a listing id is not a variant
-- id. Nothing is translated forward — an abandoned line in a shop's first week is not worth a
-- backfill, and a shopper re-adding the product is the cheaper correction.
DELETE FROM "commerce"."cart_items";
