CREATE TYPE "vritti_core"."purchase_order_status" AS ENUM('DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "vritti_core"."supplier_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"supplier_code" varchar(100),
	"unit_price" numeric(12,2),
	"uom_id" uuid,
	"min_order_quantity" numeric(12,3),
	"lead_time_days" integer,
	"is_preferred" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_supplier_items_supplier_item" UNIQUE("supplier_id","inventory_item_id")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(100) NOT NULL,
	"contact_name" varchar(255),
	"phone" varchar(20),
	"email" varchar(255),
	"address" varchar(500),
	"gstin" varchar(15),
	"payment_terms" varchar(50),
	"lead_time_days" integer,
	"notes" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_suppliers_bu_code" UNIQUE("business_unit_id","code")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."purchase_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"ordered_quantity" numeric(12,3) NOT NULL,
	"received_quantity" numeric(12,3) DEFAULT '0' NOT NULL,
	"unit_price" numeric(12,2),
	"total_price" numeric(12,2),
	CONSTRAINT "uq_purchase_order_items_po_item" UNIQUE("purchase_order_id","inventory_item_id")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"po_number" varchar(50) NOT NULL,
	"status" "vritti_core"."purchase_order_status" DEFAULT 'DRAFT'::"vritti_core"."purchase_order_status" NOT NULL,
	"order_date" date NOT NULL,
	"expected_date" date,
	"notes" text,
	"total_amount" numeric(12,2),
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_purchase_orders_bu_po_number" UNIQUE("business_unit_id","po_number")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."goods_receipt_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"goods_receipt_id" uuid NOT NULL,
	"purchase_order_item_id" uuid NOT NULL,
	"accepted_quantity" numeric(12,3) NOT NULL,
	"rejected_quantity" numeric(12,3) DEFAULT '0' NOT NULL,
	"rejection_reason" text
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."goods_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"received_by" uuid,
	"received_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_supplier_items_supplier" ON "vritti_core"."supplier_items" ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_suppliers_bu" ON "vritti_core"."suppliers" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_order_items_po" ON "vritti_core"."purchase_order_items" ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_bu" ON "vritti_core"."purchase_orders" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_supplier" ON "vritti_core"."purchase_orders" ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_items_gr" ON "vritti_core"."goods_receipt_items" ("goods_receipt_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipts_po" ON "vritti_core"."goods_receipts" ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipts_bu" ON "vritti_core"."goods_receipts" ("organization_id","business_unit_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_items" ADD CONSTRAINT "supplier_items_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "vritti_core"."suppliers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_items" ADD CONSTRAINT "supplier_items_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_items" ADD CONSTRAINT "supplier_items_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "vritti_core"."uom"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "vritti_core"."purchase_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "vritti_core"."suppliers"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_goods_receipt_id_goods_receipts_id_fkey" FOREIGN KEY ("goods_receipt_id") REFERENCES "vritti_core"."goods_receipts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_LfHoAU3Xn983_fkey" FOREIGN KEY ("purchase_order_item_id") REFERENCES "vritti_core"."purchase_order_items"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipts" ADD CONSTRAINT "goods_receipts_purchase_order_id_purchase_orders_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "vritti_core"."purchase_orders"("id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."suppliers" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."suppliers" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."suppliers" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."suppliers" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."suppliers" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."purchase_orders" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."purchase_orders" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."purchase_orders" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."purchase_orders" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."purchase_orders" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."goods_receipts" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."goods_receipts" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."goods_receipts" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."goods_receipts" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."goods_receipts" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);