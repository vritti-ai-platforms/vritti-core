CREATE TYPE "vritti_core"."inventory_item_type" AS ENUM('MATERIAL', 'PRODUCT');--> statement-breakpoint
CREATE TYPE "vritti_core"."inventory_ledger_type" AS ENUM('GOODS_RECEIPT', 'ORDER_RESERVE', 'ORDER_DEDUCT', 'ORDER_CANCEL', 'ADJUSTMENT', 'CONVERSION_INPUT', 'CONVERSION_OUTPUT', 'TRANSFER_OUT', 'TRANSFER_IN');--> statement-breakpoint
CREATE TABLE "vritti_core"."inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(100) NOT NULL,
	"type" "vritti_core"."inventory_item_type" NOT NULL,
	"description" varchar(500),
	"uom_id" uuid NOT NULL,
	"requires_shipping" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inventory_items_bu_code" UNIQUE("business_unit_id","code")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."inventory_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"stocked_quantity" numeric(12,3) DEFAULT '0' NOT NULL,
	"reserved_quantity" numeric(12,3) DEFAULT '0' NOT NULL,
	"reorder_level" numeric(12,3) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inventory_levels_item_bu" UNIQUE("inventory_item_id","business_unit_id")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."inventory_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"type" "vritti_core"."inventory_ledger_type" NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"balance_after" numeric(12,3) NOT NULL,
	"reference_type" varchar(50),
	"reference_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."bom" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."bom" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."bom_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"bom_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"required_quantity" numeric(12,3) NOT NULL,
	CONSTRAINT "uq_bom_lines_bom_item" UNIQUE("bom_id","inventory_item_id")
);
--> statement-breakpoint
CREATE INDEX "idx_inventory_items_bu" ON "vritti_core"."inventory_items" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_levels_item" ON "vritti_core"."inventory_levels" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_levels_bu" ON "vritti_core"."inventory_levels" ("business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_ledger_item" ON "vritti_core"."inventory_ledger" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_ledger_bu" ON "vritti_core"."inventory_ledger" ("business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_ledger_ref" ON "vritti_core"."inventory_ledger" ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_ledger_created" ON "vritti_core"."inventory_ledger" ("inventory_item_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_bom_bu_code" ON "vritti_core"."bom" ("business_unit_id","code");--> statement-breakpoint
CREATE INDEX "idx_bom_bu" ON "vritti_core"."bom" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_bom_lines_bom" ON "vritti_core"."bom_lines" ("bom_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."item_variants" ADD CONSTRAINT "item_variants_bom_id_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "vritti_core"."bom"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" ADD CONSTRAINT "inventory_items_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "vritti_core"."uom"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_levels" ADD CONSTRAINT "inventory_levels_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_ledger" ADD CONSTRAINT "inventory_ledger_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."bom_lines" ADD CONSTRAINT "bom_lines_bom_id_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "vritti_core"."bom"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."bom_lines" ADD CONSTRAINT "bom_lines_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."inventory_items" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."inventory_items" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."inventory_items" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."inventory_items" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."inventory_items" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."bom" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."bom" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."bom" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."bom" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."bom" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);