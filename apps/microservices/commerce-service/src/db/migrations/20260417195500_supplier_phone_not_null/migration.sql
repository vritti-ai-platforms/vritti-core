UPDATE "vritti_core"."suppliers"
SET "phone" = ''
WHERE "phone" IS NULL;

UPDATE "vritti_core"."supplier_contacts"
SET "phone" = ''
WHERE "phone" IS NULL;

ALTER TABLE "vritti_core"."suppliers"
  ALTER COLUMN "phone" SET NOT NULL;

ALTER TABLE "vritti_core"."supplier_contacts"
  ALTER COLUMN "phone" SET NOT NULL;
