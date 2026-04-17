ALTER TYPE "vritti_core"."storage_location_role"
  ADD VALUE IF NOT EXISTS 'ZONE';

UPDATE "vritti_core"."storage_locations" AS p
SET "location_role" = 'ZONE'::"vritti_core"."storage_location_role"
WHERE EXISTS (
  SELECT 1
  FROM "vritti_core"."storage_locations" AS c
  WHERE c."parent_id" = p."id"
);
