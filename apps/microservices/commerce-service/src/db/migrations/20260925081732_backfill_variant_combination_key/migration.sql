-- Backfills combination_key from the variant's dimension values.
-- COLLATE "C" gives byte ordering, matching the service's [...valueIds].sort(); a linguistic
-- collation orders the uuid strings differently and would produce keys the app never regenerates.
UPDATE "commerce"."offering_variants" v
SET "combination_key" = COALESCE(k.ck, '')
FROM (
  SELECT vv."variant_id",
         string_agg(vv."value_id"::text, '|' ORDER BY vv."value_id"::text COLLATE "C") AS ck
  FROM "commerce"."offering_variant_values" vv
  GROUP BY vv."variant_id"
) k
WHERE k."variant_id" = v."id";
--> statement-breakpoint
UPDATE "commerce"."offering_variants"
SET "combination_key" = ''
WHERE "combination_key" IS NULL;
