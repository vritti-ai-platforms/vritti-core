-- Restore the cost-allocation apparatus dropped in 20260607000000_quant_cost_at_creation:
--   * inventory_item_costs (cost header) + inventory_item_quant_costs (per-quant allocation junction).
-- The enums (cost_category_kind / cost_source_type / cost_distribution_method) and cost_categories
-- were never dropped, so they are reused as-is. The per-quant allocations let the quant's cost
-- reconcile to the amount paid without a rounding residual.

-- ============================================================================
-- 1. inventory_item_costs (org-scoped, polymorphic source)
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
-- 2. inventory_item_quant_costs (junction)
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
-- 3. Grants — app role default privileges don't auto-propagate to new tables
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "vritti_core" TO "vritti_core_app";--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "vritti_core" TO "vritti_core_app";
