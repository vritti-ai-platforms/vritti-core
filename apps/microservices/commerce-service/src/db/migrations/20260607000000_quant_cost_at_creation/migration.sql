-- Quant cost model: unit_cost set at creation, single merge path, retire cost-association.
--   * Drop the cost-association apparatus: inventory_item_quant_costs (junction) + inventory_item_costs.
--   * Drop cost_associated_at from goods_receipts and stock_adjustments (no post-hoc association run).
--   * inventory_item_quants.unit_cost becomes the single source of truth: drop its 0 default and
--     enforce unit_cost > 0 via a CHECK constraint (existing non-positive rows are bumped to 1 first).

DROP TABLE IF EXISTS "vritti_core"."inventory_item_quant_costs";--> statement-breakpoint
DROP TABLE IF EXISTS "vritti_core"."inventory_item_costs";--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipts" DROP COLUMN IF EXISTS "cost_associated_at";--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustments" DROP COLUMN IF EXISTS "cost_associated_at";--> statement-breakpoint
UPDATE "vritti_core"."inventory_item_quants" SET "unit_cost" = 1 WHERE "unit_cost" <= 0;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_quants" ALTER COLUMN "unit_cost" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_quants" ADD CONSTRAINT "ck_inventory_item_quants_unit_cost_positive" CHECK ("unit_cost" > 0);
