-- Custom SQL migration file, put your code below! --
UPDATE "commerce"."inventory_items" SET "display_uom_id" = "uom_id" WHERE "display_uom_id" IS NULL;
