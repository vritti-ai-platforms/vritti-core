UPDATE "commerce"."offering_variants" v
SET "tax_class_id" = o."tax_class_id"
FROM "commerce"."offerings" o
WHERE o."id" = v."offering_id"
  AND v."tax_class_id" IS NULL;
