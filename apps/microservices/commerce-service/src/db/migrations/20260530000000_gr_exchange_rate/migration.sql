-- Phase: GR exchange-rate snapshot.
--
-- The goods receipt itself now carries the supplier→BU exchange rate used at cost-association
-- time. GR-items continue to store unit_price in supplier currency; cost rows + quants are in BU
-- currency, computed at publish via `unit_price × primary_uom_qty × gr.exchange_rate`.
--
-- Rate source per the create-GR rules:
--   * Supplier currency == BU currency  → 1
--   * PO-linked + FIXED                 → po.exchange_rate (locked)
--   * PO-linked + VARIABLE  /  no PO    → user-entered at GR creation
--
-- NOT NULL with default 1 so existing rows backfill safely. PO-linked rows pick up po.exchange_rate.

ALTER TABLE "vritti_core"."goods_receipts"
  ADD COLUMN "exchange_rate" decimal(18, 6) NOT NULL DEFAULT 1;--> statement-breakpoint

-- Backfill from the linked PO when present. Un-linked rows (or PO rate = 1) keep the default.
UPDATE "vritti_core"."goods_receipts" gr
SET "exchange_rate" = po."exchange_rate"
FROM "vritti_core"."purchase_orders" po
WHERE gr."purchase_order_id" = po."id"
  AND po."exchange_rate" IS NOT NULL;
