-- Quant cost/value tracking: total cost laid into a quant and its remaining value.
--   * quant_cost  — Σ allocated_amount across this quant's inventory_item_quant_costs rows (BU minor units).
--   * quant_value — remaining value; decremented on each outflow and cleared to 0 on final depletion.
-- Existing rows are backfilled from unit_cost × quantity so legacy stock has a sensible baseline.

ALTER TABLE "vritti_core"."inventory_item_quants" ADD COLUMN "quant_cost" bigint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_quants" ADD COLUMN "quant_value" bigint NOT NULL DEFAULT 0;--> statement-breakpoint
UPDATE "vritti_core"."inventory_item_quants"
  SET "quant_cost" = ROUND("unit_cost"::numeric * "quantity")::bigint,
      "quant_value" = ROUND("unit_cost"::numeric * "quantity")::bigint;
