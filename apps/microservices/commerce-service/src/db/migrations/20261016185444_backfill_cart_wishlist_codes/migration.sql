-- Custom SQL migration file, put your code below! --

UPDATE "commerce"."cart_items" ci
   SET "code" = ov."code"
  FROM "commerce"."offering_variants" ov
 WHERE ov."id" = ci."offering_variant_id"
   AND ci."code" IS NULL;
--> statement-breakpoint
UPDATE "commerce"."wishlist_items" wi
   SET "code" = ov."code"
  FROM "commerce"."offering_variants" ov
 WHERE ov."id" = wi."offering_variant_id"
   AND wi."code" IS NULL;
--> statement-breakpoint
-- A line whose variant has since vanished cannot be carried forward, and the next migration makes
-- the column NOT NULL. There is no such row today (the FK to offering_variants is ON DELETE CASCADE,
-- so a deleted variant took its lines with it) — this is here so the migration fails loudly rather
-- than the NOT NULL doing it with a less obvious message.
DO $$
DECLARE orphaned int;
BEGIN
  SELECT (SELECT count(*) FROM "commerce"."cart_items" WHERE "code" IS NULL)
       + (SELECT count(*) FROM "commerce"."wishlist_items" WHERE "code" IS NULL)
    INTO orphaned;
  IF orphaned > 0 THEN
    RAISE EXCEPTION 'Cannot backfill % cart/wishlist line(s): the variant they point at no longer exists', orphaned;
  END IF;
END $$;
