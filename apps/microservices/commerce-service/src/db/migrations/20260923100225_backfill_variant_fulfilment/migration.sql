-- Existing variants inherit their offering's fulfilment type; none of them is an override yet.
UPDATE "commerce"."offering_variants" v
SET "fulfilment_type" = o."fulfilment_type"
FROM "commerce"."offerings" o
WHERE o."id" = v."offering_id"
  AND v."fulfilment_type" IS NULL;
