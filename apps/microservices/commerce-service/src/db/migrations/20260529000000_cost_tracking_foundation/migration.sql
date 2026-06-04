-- Cost-tracking foundation (PR 1 / Phase 1):
--   * Three new tables: cost_categories, inventory_item_costs, inventory_item_quant_costs.
--   * Three new enums: cost_category_kind, cost_source_type, cost_distribution_method.
--   * Extends inventory_item_quants with denormalized cost columns + polymorphic provenance.
--   * Adds cost_associated_at to goods_receipts and stock_adjustments.
--   * Adds primary_uom_qty snapshot to goods_receipt_lines (stock_adjustment_lines already has it).
--   * Adds write_off_amount + write_off_currency to stock_adjustment_lines for negative SAs.
--
-- pick_strategy enum and business_units.pick_strategy column live in the core-server migration tree
-- (separate file under apps/core-server/src/db/migrations) since business_units belongs to that
-- project's Drizzle schema.

-- ============================================================================
-- 1. Enums
-- ============================================================================

CREATE TYPE "vritti_core"."cost_category_kind" AS ENUM ('item', 'freight', 'duty', 'insurance', 'service', 'other');--> statement-breakpoint
CREATE TYPE "vritti_core"."cost_source_type" AS ENUM ('goods_receipt', 'stock_adjustment', 'stock_transfer', 'manual_adjustment');--> statement-breakpoint
CREATE TYPE "vritti_core"."cost_distribution_method" AS ENUM ('by_value', 'by_quantity', 'equal');--> statement-breakpoint

-- ============================================================================
-- 2. cost_categories (org-scoped, no business_unit_id)
-- ============================================================================

CREATE TABLE "vritti_core"."cost_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
  "code" varchar(50) NOT NULL,
  "name" varchar(255) NOT NULL,
  "kind" "vritti_core"."cost_category_kind" NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "is_system" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "vritti_core"."cost_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_cost_categories_org_code" ON "vritti_core"."cost_categories" ("organization_id", "code");--> statement-breakpoint
CREATE INDEX "idx_cost_categories_org" ON "vritti_core"."cost_categories" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_cost_categories_kind" ON "vritti_core"."cost_categories" ("kind");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."cost_categories" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint

-- ============================================================================
-- 3. inventory_item_costs (org-scoped, polymorphic source)
-- ============================================================================

CREATE TABLE "vritti_core"."inventory_item_costs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
  "category_id" uuid NOT NULL,
  "total_amount" bigint NOT NULL,
  "currency_code" varchar(3) NOT NULL,
  "source_type" "vritti_core"."cost_source_type" NOT NULL,
  "source_id" uuid NOT NULL,
  "distribution_method" "vritti_core"."cost_distribution_method" NOT NULL DEFAULT 'by_value',
  "unallocated_amount" bigint NOT NULL DEFAULT 0,
  "vendor_ref" varchar(100),
  "notes" text,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_costs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_costs"
  ADD CONSTRAINT "inventory_item_costs_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "vritti_core"."cost_categories"("id") ON DELETE RESTRICT;--> statement-breakpoint
CREATE INDEX "idx_inventory_item_costs_source" ON "vritti_core"."inventory_item_costs" ("source_type", "source_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_costs_category" ON "vritti_core"."inventory_item_costs" ("category_id", "source_type", "source_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_costs_created_at" ON "vritti_core"."inventory_item_costs" ("created_at");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."inventory_item_costs" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint

-- ============================================================================
-- 4. inventory_item_quant_costs (junction)
-- ============================================================================

CREATE TABLE "vritti_core"."inventory_item_quant_costs" (
  "quant_id" uuid NOT NULL,
  "cost_id" uuid NOT NULL,
  "allocated_amount" bigint NOT NULL,
  "organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "pk_inventory_item_quant_costs" PRIMARY KEY ("quant_id", "cost_id")
);--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_quant_costs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_quant_costs"
  ADD CONSTRAINT "inventory_item_quant_costs_quant_id_fkey"
  FOREIGN KEY ("quant_id") REFERENCES "vritti_core"."inventory_item_quants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_quant_costs"
  ADD CONSTRAINT "inventory_item_quant_costs_cost_id_fkey"
  FOREIGN KEY ("cost_id") REFERENCES "vritti_core"."inventory_item_costs"("id") ON DELETE RESTRICT;--> statement-breakpoint
CREATE INDEX "idx_inventory_item_quant_costs_cost" ON "vritti_core"."inventory_item_quant_costs" ("cost_id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."inventory_item_quant_costs" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint

-- ============================================================================
-- 5. inventory_item_quants — add cost columns + provenance + indexes
-- ============================================================================

ALTER TABLE "vritti_core"."inventory_item_quants"
  ADD COLUMN "total_unit_cost" bigint NOT NULL DEFAULT 0,
  ADD COLUMN "cost_currency" varchar(3),
  ADD COLUMN "source_type" "vritti_core"."cost_source_type",
  ADD COLUMN "source_id" uuid;--> statement-breakpoint

-- Backfill cost_currency from the BU's home currency. business_units lives in the same
-- vritti_core PG schema (owned by core-server's Drizzle tree).
UPDATE "vritti_core"."inventory_item_quants" q
SET "cost_currency" = bu."currency_code"
FROM "vritti_core"."business_units" bu
WHERE bu."id" = q."business_unit_id" AND q."cost_currency" IS NULL;--> statement-breakpoint

-- Best-effort source provenance: quants resolved from a GR line point to that goods_receipt.
UPDATE "vritti_core"."inventory_item_quants" q
SET "source_type" = 'goods_receipt', "source_id" = gri."goods_receipt_id"
FROM "vritti_core"."goods_receipt_lines" gl
JOIN "vritti_core"."goods_receipt_items" gri ON gri."id" = gl."goods_receipt_item_id"
WHERE gl."resolved_quant_id" = q."id" AND q."source_type" IS NULL;--> statement-breakpoint

-- Next: quants resolved from a SA line (opening stock / positive correction).
UPDATE "vritti_core"."inventory_item_quants" q
SET "source_type" = 'stock_adjustment', "source_id" = sal."stock_adjustment_id"
FROM "vritti_core"."stock_adjustment_lines" sal
WHERE sal."resolved_quant_id" = q."id" AND q."source_type" IS NULL;--> statement-breakpoint

-- Fallback: orphan quants (no traceable GR/SA) become self-referencing manual_adjustment rows.
-- Polymorphic source_id has no DB FK so self-reference is permitted.
UPDATE "vritti_core"."inventory_item_quants"
SET "source_type" = 'manual_adjustment', "source_id" = "id"
WHERE "source_type" IS NULL;--> statement-breakpoint

-- cost_currency / source_type / source_id stay NULLABLE during the PR1 transition. Existing rows
-- are backfilled above; new inserts from un-updated callers will write NULL until Phase 3 (GR
-- publish) + Phase 4 (SA publish) start setting them. A follow-up PR tightens NOT NULL afterwards.

CREATE INDEX "idx_inventory_item_quants_item_location_lot" ON "vritti_core"."inventory_item_quants" ("inventory_item_id", "location_id", "lot_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_quants_source" ON "vritti_core"."inventory_item_quants" ("source_type", "source_id");--> statement-breakpoint
-- Partial index — hot path for pick / availability checks scopes to rows with positive stock.
CREATE INDEX "idx_inventory_item_quants_active" ON "vritti_core"."inventory_item_quants" ("inventory_item_id", "location_id") WHERE "quantity" > 0;--> statement-breakpoint

-- ============================================================================
-- 6. goods_receipts / stock_adjustments — cost-association timestamp
-- ============================================================================

ALTER TABLE "vritti_core"."goods_receipts" ADD COLUMN "cost_associated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustments" ADD COLUMN "cost_associated_at" timestamp with time zone;--> statement-breakpoint

-- ============================================================================
-- 7. goods_receipt_lines — primary UOM snapshot
-- ============================================================================

ALTER TABLE "vritti_core"."goods_receipt_lines" ADD COLUMN "primary_uom_qty" numeric(12, 3);--> statement-breakpoint

-- Backfill: where gr_item.uom_id == inventory_item.uom_id, factor=1 → primary_uom_qty = quantity.
UPDATE "vritti_core"."goods_receipt_lines" gl
SET "primary_uom_qty" = gl."quantity"
FROM "vritti_core"."goods_receipt_items" gri
JOIN "vritti_core"."inventory_items" ii ON ii."id" = gri."inventory_item_id"
WHERE gri."id" = gl."goods_receipt_item_id"
  AND gri."uom_id" = ii."uom_id"
  AND gl."primary_uom_qty" IS NULL;--> statement-breakpoint

-- Backfill: where a per-item override exists, apply (primary_uom_qty / uom_qty) ratio.
UPDATE "vritti_core"."goods_receipt_lines" gl
SET "primary_uom_qty" = gl."quantity" * (iiuc."primary_uom_qty"::numeric / NULLIF(iiuc."uom_qty", 0)::numeric)
FROM "vritti_core"."goods_receipt_items" gri
JOIN "vritti_core"."inventory_item_uom_conversions" iiuc
  ON iiuc."inventory_item_id" = gri."inventory_item_id" AND iiuc."uom_id" = gri."uom_id"
WHERE gri."id" = gl."goods_receipt_item_id"
  AND gl."primary_uom_qty" IS NULL;--> statement-breakpoint

-- Fallback: no override, no match — fall back to assuming factor=1 (best effort for legacy data).
UPDATE "vritti_core"."goods_receipt_lines"
SET "primary_uom_qty" = "quantity"
WHERE "primary_uom_qty" IS NULL;--> statement-breakpoint

-- primary_uom_qty stays NULLABLE during PR1 transition; Phase 3 (GR publish) starts setting it on
-- new rows. Tighten to NOT NULL once the publish service is updated.

-- ============================================================================
-- 8. stock_adjustment_lines — write-off snapshot
-- ============================================================================

ALTER TABLE "vritti_core"."stock_adjustment_lines"
  ADD COLUMN "write_off_amount" bigint NOT NULL DEFAULT 0,
  ADD COLUMN "write_off_currency" varchar(3);--> statement-breakpoint

UPDATE "vritti_core"."stock_adjustment_lines" sal
SET "write_off_currency" = bu."currency_code"
FROM "vritti_core"."business_units" bu
WHERE bu."id" = sal."business_unit_id" AND sal."write_off_currency" IS NULL;--> statement-breakpoint

-- write_off_currency stays NULLABLE during PR1 transition; Phase 4 (SA publish) starts setting it
-- on new rows. Tighten to NOT NULL once that lands.
