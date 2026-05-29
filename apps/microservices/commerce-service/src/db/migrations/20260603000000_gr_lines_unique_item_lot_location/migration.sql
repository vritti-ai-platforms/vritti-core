-- DB-level backstop for the service guard in goods-receipt-lines.service.ts that rejects two
-- lines on the same (item, lot, location). Same tuple a draft GR's tree groups by; two lines for
-- the same shelf collapse into one logical receipt and double-count the accepted quantity.
--
-- NULLS NOT DISTINCT (PG 15+) makes lot_id NULL collisions count for tracking='quantity' and
-- 'serial' items, which don't use the lot column.
--
-- The matching service-layer guard catches the same case earlier and returns a friendly 422; this
-- constraint is the race-condition backstop and surfaces as 23505 → ConflictException in
-- addLine's try/catch.

ALTER TABLE "vritti_core"."goods_receipt_lines"
  ADD CONSTRAINT "uq_goods_receipt_lines_item_lot_location"
  UNIQUE NULLS NOT DISTINCT (goods_receipt_item_id, goods_receipt_lot_id, location_id);
