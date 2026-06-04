CREATE UNIQUE INDEX "uq_stock_adjustment_lines_lot_location_uom"
  ON "vritti_core"."stock_adjustment_lines" (
    "stock_adjustment_id", "stock_adjustment_lot_id", "location_id", "uom_id"
  )
  NULLS NOT DISTINCT
  WHERE "quant_id" IS NULL;
