-- Adds conversionFactor and primaryUomUnitPrice to purchase_order_items.
-- conversionFactor: how many primary/base UOM units equal 1 order UOM unit (e.g. 12 for Box → Each).
-- primaryUomUnitPrice: price per base UOM unit in PO currency minor units (round(unitPrice / conversionFactor)).

ALTER TABLE "vritti_core"."purchase_order_items"
  ADD COLUMN "conversion_factor" numeric(15,6) NOT NULL DEFAULT 1,
  ADD COLUMN "primary_uom_unit_price" bigint NOT NULL DEFAULT 0;
