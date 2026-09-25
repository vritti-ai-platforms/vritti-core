-- Seeds is_offering_active from each variant's offering. The column was added DEFAULT false, so
-- without this every variant of an active offering would read as unsellable. From here on the
-- triggers in src/db/objects/ keep the two in step.
UPDATE "commerce"."offering_variants" v
SET "is_offering_active" = o."is_active"
FROM "commerce"."offerings" o
WHERE o."id" = v."offering_id"
  AND v."is_offering_active" IS DISTINCT FROM o."is_active";
