-- Kompally Warehouse's supplier prices become its legal entity's, so every site of the legal entity without a price of
-- its own in force pays them; the other sites' prices stay theirs and override these
UPDATE "commerce"."supplier_item_prices"
SET "site_id" = NULL, "updated_at" = now()
WHERE "site_id" = '01a1835b-abf5-78a6-ad65-966b842e5590';
