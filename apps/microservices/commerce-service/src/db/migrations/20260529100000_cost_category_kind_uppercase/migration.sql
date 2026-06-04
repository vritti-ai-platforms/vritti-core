-- Uppercase the cost_category_kind enum values and enforce "exactly one ITEM category per org".
--
-- Rationale:
--   * The Hybrid cost-association flow needs a deterministic lookup for the supplier-price cost
--     category at GR publish time. Anchoring on `kind = 'ITEM'` (instead of a magic code string)
--     gives a clean, configuration-driven lookup.
--   * Internal stock transfers do NOT need a unique TRANSFER kind — the user picks a FREIGHT
--     category at transfer time, the same way they pick freight on a GR.
--   * Uppercase matches the convention used by other domain enums in this schema (PurchaseOrderStatus,
--     GoodsReceiptStatus, StockAdjustmentType, etc.).

ALTER TYPE "vritti_core"."cost_category_kind" RENAME VALUE 'item' TO 'ITEM';--> statement-breakpoint
ALTER TYPE "vritti_core"."cost_category_kind" RENAME VALUE 'freight' TO 'FREIGHT';--> statement-breakpoint
ALTER TYPE "vritti_core"."cost_category_kind" RENAME VALUE 'duty' TO 'DUTY';--> statement-breakpoint
ALTER TYPE "vritti_core"."cost_category_kind" RENAME VALUE 'insurance' TO 'INSURANCE';--> statement-breakpoint
ALTER TYPE "vritti_core"."cost_category_kind" RENAME VALUE 'service' TO 'SERVICE';--> statement-breakpoint
ALTER TYPE "vritti_core"."cost_category_kind" RENAME VALUE 'other' TO 'OTHER';--> statement-breakpoint

-- Partial unique index — at most one ITEM-kind category per org. ITEM is the deterministic
-- target of the GR publish auto-associate; if there were two, publish wouldn't know which to use.
CREATE UNIQUE INDEX "uq_cost_categories_org_kind_item"
  ON "vritti_core"."cost_categories" ("organization_id")
  WHERE "kind" = 'ITEM';
