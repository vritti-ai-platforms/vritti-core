-- Custom SQL migration file, put your code below! --
UPDATE "commerce"."locations" x SET "legal_entity_id" = known."legal_entity_id"
FROM (
  SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."inventory_item_site_stock_levels"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."supplier_enrollments"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."purchases"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."goods_receipts"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."purchase_orders"
) known
WHERE x."legal_entity_id" IS NULL AND known."site_id" = x."site_id";
--> statement-breakpoint
UPDATE "commerce"."inventory_item_quants" x SET "legal_entity_id" = known."legal_entity_id"
FROM (
  SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."inventory_item_site_stock_levels"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."supplier_enrollments"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."purchases"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."goods_receipts"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."purchase_orders"
) known
WHERE x."legal_entity_id" IS NULL AND known."site_id" = x."site_id";
--> statement-breakpoint
UPDATE "commerce"."inventory_item_locations" x SET "legal_entity_id" = known."legal_entity_id"
FROM (
  SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."inventory_item_site_stock_levels"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."supplier_enrollments"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."purchases"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."goods_receipts"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."purchase_orders"
) known
WHERE x."legal_entity_id" IS NULL AND known."site_id" = x."site_id";
--> statement-breakpoint
UPDATE "commerce"."inventory_item_ledger" x SET "legal_entity_id" = known."legal_entity_id"
FROM (
  SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."inventory_item_site_stock_levels"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."supplier_enrollments"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."purchases"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."goods_receipts"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."purchase_orders"
) known
WHERE x."legal_entity_id" IS NULL AND known."site_id" = x."site_id";
--> statement-breakpoint
UPDATE "commerce"."stock_adjustments" x SET "legal_entity_id" = known."legal_entity_id"
FROM (
  SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."inventory_item_site_stock_levels"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."supplier_enrollments"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."purchases"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."goods_receipts"
  UNION SELECT DISTINCT "site_id", "legal_entity_id" FROM "commerce"."purchase_orders"
) known
WHERE x."legal_entity_id" IS NULL AND known."site_id" = x."site_id";
