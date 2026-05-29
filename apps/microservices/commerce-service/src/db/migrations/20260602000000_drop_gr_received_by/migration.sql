-- Drop goods_receipts.received_by.
--
-- The column was never populated (all rows had NULL in dev) and never wired into the create-GR
-- flow. Dropping it removes dead schema; the "Received By" field disappears from the GR detail
-- and the PO → GR list at the same time. No FK or RLS policy references it, so a plain DROP
-- COLUMN is sufficient.

ALTER TABLE "vritti_core"."goods_receipts" DROP COLUMN IF EXISTS "received_by";
