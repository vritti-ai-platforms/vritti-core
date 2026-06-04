-- Capture supplier unit price at the GR breakdown step (Phase 5.5).
--
-- The Hybrid auto-associate previously sourced supplier price from `purchase_order_items`, which
-- left un-linked GRs without a SUPPLIER_PRICE cost row. This shifts the source onto the GR-item
-- itself. The user captures (or accepts the pre-fill of) the unit price at add-item time; the
-- publish service then uses `gr_item.primary_uom_unit_price` regardless of PO linkage.
--
-- Columns are NULLABLE during the transition. A follow-up PR tightens to NOT NULL once every
-- code path is updated.

ALTER TABLE "vritti_core"."goods_receipt_items"
  ADD COLUMN "unit_price" bigint,
  ADD COLUMN "primary_uom_unit_price" bigint,
  ADD COLUMN "currency_code" varchar(3);--> statement-breakpoint

-- Backfill #1 — PO-linked GR-items get the negotiated PO price. PG quirk: in UPDATE…FROM, the
-- target table can't be referenced from a JOIN inside FROM, so we list the joined tables
-- comma-separated and link them via WHERE.
UPDATE "vritti_core"."goods_receipt_items" gri
SET
  "unit_price" = poi."unit_price",
  "primary_uom_unit_price" = poi."primary_uom_unit_price",
  "currency_code" = poi."currency_code"
FROM "vritti_core"."purchase_order_items" poi,
     "vritti_core"."goods_receipts" gr
WHERE gr."id" = gri."goods_receipt_id"
  AND poi."purchase_order_id" = gr."purchase_order_id"
  AND poi."inventory_item_id" = gri."inventory_item_id"
  AND poi."uom_id" = gri."uom_id";--> statement-breakpoint

-- Backfill #2 — un-linked GR-items fall back to the supplier catalog price (supplier_items).
-- `primary_uom_unit_price` is left NULL here; a one-time script can compute it post-deploy via
-- UomConversionsService if needed. Without it, autoAssociateSupplierPrice skips the row at
-- publish; the user can still post the supplier price manually via Add Cost.
UPDATE "vritti_core"."goods_receipt_items" gri
SET
  "unit_price" = si."unit_price",
  "currency_code" = si."currency_code"
FROM "vritti_core"."supplier_items" si,
     "vritti_core"."goods_receipts" gr
WHERE gri."unit_price" IS NULL
  AND gr."id" = gri."goods_receipt_id"
  AND si."supplier_id" = gr."supplier_id"
  AND si."inventory_item_id" = gri."inventory_item_id"
  AND si."uom_id" = gri."uom_id";
