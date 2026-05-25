-- Replace the per-line conversion_factor snapshot with a primary_qty snapshot.
--
-- Rationale: UOM conversion math (qty × factor) must live in the service layer in Decimal, not in
-- SQL. Storing primary_qty directly removes the need for SQL to multiply qty × factor anywhere; all
-- downstream aggregations become a simple SUM(primary_qty) on a stored decimal column. New writes
-- compute primary_qty via UomConversionsService.toPrimaryQuantity before reaching the line.
--
-- Affects two tables: stock_adjustment_lines and purchase_order_items.

-- ===== stock_adjustment_lines =====
ALTER TABLE "vritti_core"."stock_adjustment_lines" ADD COLUMN "primary_qty" decimal(12, 3);--> statement-breakpoint
UPDATE "vritti_core"."stock_adjustment_lines" SET "primary_qty" = "quantity" * "conversion_factor";--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lines" ALTER COLUMN "primary_qty" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lines" DROP COLUMN "conversion_factor";--> statement-breakpoint

-- ===== purchase_order_items =====
ALTER TABLE "vritti_core"."purchase_order_items" ADD COLUMN "primary_qty" decimal(12, 3);--> statement-breakpoint
UPDATE "vritti_core"."purchase_order_items" SET "primary_qty" = "quantity" * "conversion_factor";--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_order_items" ALTER COLUMN "primary_qty" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_order_items" DROP COLUMN "conversion_factor";
