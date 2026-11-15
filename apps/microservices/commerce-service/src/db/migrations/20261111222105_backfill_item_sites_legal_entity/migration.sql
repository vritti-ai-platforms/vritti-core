-- Custom SQL migration file, put your code below! --
UPDATE "commerce"."inventory_item_sites" s SET "legal_entity_id" = known."legal_entity_id"
FROM (
  SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."supplier_enrollments"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."purchases"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."goods_receipts"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."purchase_orders"
) known
WHERE s."legal_entity_id" IS NULL AND known."site_id" = s."site_id";
--> statement-breakpoint
DELETE FROM "commerce"."inventory_item_sites" WHERE "legal_entity_id" IS NULL;
