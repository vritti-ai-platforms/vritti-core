ALTER TABLE "vritti_core"."suppliers"
  ADD COLUMN "website" varchar(255);

ALTER TABLE "vritti_core"."supplier_contacts"
  ADD COLUMN "alternate_mobile" varchar(20),
  ADD COLUMN "alternate_email" varchar(255);
