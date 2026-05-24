-- Extend purchase_order_status enum with:
-- - PENDING_APPROVAL, APPROVED, REJECTED: reserved for the upcoming approval workflow (no transitions wired yet)
-- - CLOSED: "no further receipts expected" for short-shipped / abandoned POs; replaces the broken
--   PARTIALLY_RECEIVED → CANCELLED path.
-- Postgres ALTER TYPE ... ADD VALUE is online-safe and non-blocking.

ALTER TYPE "vritti_core"."purchase_order_status" ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL';--> statement-breakpoint
ALTER TYPE "vritti_core"."purchase_order_status" ADD VALUE IF NOT EXISTS 'APPROVED';--> statement-breakpoint
ALTER TYPE "vritti_core"."purchase_order_status" ADD VALUE IF NOT EXISTS 'REJECTED';--> statement-breakpoint
ALTER TYPE "vritti_core"."purchase_order_status" ADD VALUE IF NOT EXISTS 'CLOSED';
