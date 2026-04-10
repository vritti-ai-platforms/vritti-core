CREATE TYPE "vritti_core"."conversion_status" AS ENUM('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "vritti_core"."credit_note_status" AS ENUM('DRAFT', 'ISSUED', 'PARTIALLY_APPLIED', 'FULLY_APPLIED');--> statement-breakpoint
CREATE TYPE "vritti_core"."credit_note_type" AS ENUM('PAYABLE', 'RECEIVABLE');--> statement-breakpoint
CREATE TYPE "vritti_core"."invoice_party_type" AS ENUM('SUPPLIER', 'CUSTOMER', 'AGGREGATOR');--> statement-breakpoint
CREATE TYPE "vritti_core"."invoice_type" AS ENUM('PAYABLE', 'RECEIVABLE');--> statement-breakpoint
CREATE TYPE "vritti_core"."payment_status" AS ENUM('COMPLETED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "vritti_core"."stock_adjustment_type" AS ENUM('WASTE', 'DAMAGE', 'THEFT', 'EXPIRED', 'CORRECTION', 'PRODUCTION');--> statement-breakpoint
CREATE TYPE "vritti_core"."stock_transfer_status" AS ENUM('REQUESTED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "vritti_core"."conversion_inputs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"conversion_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"wastage_quantity" numeric(12,3) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."conversion_outputs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"conversion_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"wastage_quantity" numeric(12,3) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"bom_id" uuid,
	"status" "vritti_core"."conversion_status" DEFAULT 'DRAFT'::"vritti_core"."conversion_status" NOT NULL,
	"produced_by" uuid,
	"started_at" timestamp,
	"completed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."conversions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."stock_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"type" "vritti_core"."stock_adjustment_type" NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"reason" text,
	"adjusted_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."stock_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"from_bu_id" uuid NOT NULL,
	"to_bu_id" uuid NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"status" "vritti_core"."stock_transfer_status" DEFAULT 'REQUESTED'::"vritti_core"."stock_transfer_status" NOT NULL,
	"requested_by" uuid,
	"received_by" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_transfers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"type" "vritti_core"."invoice_type" NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"party_type" "vritti_core"."invoice_party_type" NOT NULL,
	"party_id" uuid,
	"party_name" varchar(255) NOT NULL,
	"reference_type" varchar(50),
	"reference_id" uuid,
	"subtotal" numeric(12,2) NOT NULL,
	"tax_amount" numeric(12,2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(12,2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(12,2) NOT NULL,
	"paid_amount" numeric(12,2) DEFAULT '0' NOT NULL,
	"balance" numeric(12,2) NOT NULL,
	"status" "vritti_core"."invoice_status" DEFAULT 'DRAFT'::"vritti_core"."invoice_status" NOT NULL,
	"payment_terms" varchar(50),
	"issued_date" date,
	"due_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_invoices_bu_number" UNIQUE("business_unit_id","invoice_number")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."invoices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" varchar(255) NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"unit_price" numeric(12,2) NOT NULL,
	"tax_amount" numeric(12,2) DEFAULT '0' NOT NULL,
	"total" numeric(12,2) NOT NULL,
	"reference_item_id" uuid
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"method" "vritti_core"."payment_method" NOT NULL,
	"reference" varchar(255),
	"status" "vritti_core"."payment_status" DEFAULT 'COMPLETED'::"vritti_core"."payment_status" NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."credit_note_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"credit_note_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"applied_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."credit_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"type" "vritti_core"."credit_note_type" NOT NULL,
	"party_type" "vritti_core"."invoice_party_type" NOT NULL,
	"party_id" uuid,
	"party_name" varchar(255) NOT NULL,
	"credit_note_number" varchar(50) NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"applied_amount" numeric(12,2) DEFAULT '0' NOT NULL,
	"remaining" numeric(12,2) NOT NULL,
	"reason" text,
	"status" "vritti_core"."credit_note_status" DEFAULT 'DRAFT'::"vritti_core"."credit_note_status" NOT NULL,
	"issued_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_credit_notes_bu_number" UNIQUE("business_unit_id","credit_note_number")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."credit_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TYPE "vritti_core"."invoice_status" ADD VALUE IF NOT EXISTS 'PARTIALLY_PAID';--> statement-breakpoint
ALTER TYPE "vritti_core"."invoice_status" ADD VALUE IF NOT EXISTS 'OVERDUE';--> statement-breakpoint
ALTER TYPE "vritti_core"."invoice_status" ADD VALUE IF NOT EXISTS 'VOID';--> statement-breakpoint
ALTER TYPE "vritti_core"."payment_method" ADD VALUE IF NOT EXISTS 'BANK_TRANSFER';--> statement-breakpoint
ALTER TYPE "vritti_core"."payment_method" ADD VALUE IF NOT EXISTS 'ONLINE';--> statement-breakpoint
CREATE INDEX "idx_conversion_inputs_conversion" ON "vritti_core"."conversion_inputs" ("conversion_id");--> statement-breakpoint
CREATE INDEX "idx_conversion_inputs_item" ON "vritti_core"."conversion_inputs" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_conversion_outputs_conversion" ON "vritti_core"."conversion_outputs" ("conversion_id");--> statement-breakpoint
CREATE INDEX "idx_conversion_outputs_item" ON "vritti_core"."conversion_outputs" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_conversions_bu" ON "vritti_core"."conversions" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_conversions_bom" ON "vritti_core"."conversions" ("bom_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustments_bu" ON "vritti_core"."stock_adjustments" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustments_item" ON "vritti_core"."stock_adjustments" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_stock_transfers_item" ON "vritti_core"."stock_transfers" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_stock_transfers_from_bu" ON "vritti_core"."stock_transfers" ("from_bu_id");--> statement-breakpoint
CREATE INDEX "idx_stock_transfers_to_bu" ON "vritti_core"."stock_transfers" ("to_bu_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_bu" ON "vritti_core"."invoices" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_party" ON "vritti_core"."invoices" ("party_type","party_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_items_invoice" ON "vritti_core"."invoice_items" ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_payments_invoice" ON "vritti_core"."payments" ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_credit_note_applications_cn" ON "vritti_core"."credit_note_applications" ("credit_note_id");--> statement-breakpoint
CREATE INDEX "idx_credit_note_applications_invoice" ON "vritti_core"."credit_note_applications" ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_credit_notes_bu" ON "vritti_core"."credit_notes" ("organization_id","business_unit_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."conversion_inputs" ADD CONSTRAINT "conversion_inputs_conversion_id_conversions_id_fkey" FOREIGN KEY ("conversion_id") REFERENCES "vritti_core"."conversions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."conversion_inputs" ADD CONSTRAINT "conversion_inputs_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."conversion_outputs" ADD CONSTRAINT "conversion_outputs_conversion_id_conversions_id_fkey" FOREIGN KEY ("conversion_id") REFERENCES "vritti_core"."conversions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."conversion_outputs" ADD CONSTRAINT "conversion_outputs_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."conversions" ADD CONSTRAINT "conversions_bom_id_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "vritti_core"."bom"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustments" ADD CONSTRAINT "stock_adjustments_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_transfers" ADD CONSTRAINT "stock_transfers_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "vritti_core"."invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "vritti_core"."invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."credit_note_applications" ADD CONSTRAINT "credit_note_applications_credit_note_id_credit_notes_id_fkey" FOREIGN KEY ("credit_note_id") REFERENCES "vritti_core"."credit_notes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."credit_note_applications" ADD CONSTRAINT "credit_note_applications_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "vritti_core"."invoices"("id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."conversions" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."conversions" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."conversions" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."conversions" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."conversions" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."stock_adjustments" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."stock_adjustments" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."stock_adjustments" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."stock_adjustments" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."stock_adjustments" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."stock_transfers" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."invoices" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."invoices" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."invoices" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."invoices" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."invoices" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."credit_notes" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."credit_notes" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."credit_notes" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."credit_notes" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."credit_notes" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);