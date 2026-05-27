-- Drop the default on purchase_order_items.primary_uom_unit_price.
-- The service always computes and provides this value at insert/update time
-- (totalPrice / primaryUomQty, rounded via Decimal), so the default of 0 was
-- masking the fact that this column is always written explicitly. Forcing the
-- column to be required on insert matches the runtime contract.
--
-- The column remains NOT NULL; existing rows are unaffected.

ALTER TABLE "vritti_core"."purchase_order_items" ALTER COLUMN "primary_uom_unit_price" DROP DEFAULT;
