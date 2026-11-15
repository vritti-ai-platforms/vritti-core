CREATE TYPE "commerce"."purchase_item_source" AS ENUM('MANUAL');--> statement-breakpoint
CREATE TYPE "commerce"."purchase_leg_status" AS ENUM('OPEN', 'CLOSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "commerce"."purchase_leg_step" AS ENUM('SOURCING', 'APPROVAL', 'ORDER', 'ANNOUNCE', 'RECEIVE', 'RECEIVE_BILL', 'BILL', 'APPROVE_BILL', 'CLOSED');--> statement-breakpoint
CREATE TYPE "commerce"."purchase_order_billing_status" AS ENUM('NOTHING_TO_BILL', 'TO_BILL', 'PARTIAL', 'BILLED');--> statement-breakpoint
CREATE TYPE "commerce"."purchase_order_receipt_status" AS ENUM('NOT_RECEIVED', 'PARTIAL', 'RECEIVED');--> statement-breakpoint
CREATE TYPE "commerce"."purchase_status" AS ENUM('OPEN', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "commerce"."purchase_step" AS ENUM('DEMAND', 'QUOTATIONS', 'SOURCING', 'FULFILMENT');--> statement-breakpoint
CREATE TYPE "commerce"."purchase_type" AS ENUM('DIRECT_PURCHASE', 'DIRECT_RECEIPT', 'ORDER_BILL_WITH_GOODS', 'STANDARD', 'ANNOUNCED', 'PREPAID', 'SELF_BILLING');--> statement-breakpoint
CREATE TYPE "commerce"."supplier_invoice_hold_code" AS ENUM('PRICE_DIFFERS', 'QTY_NOT_RECEIVED', 'BILLED_MORE_THAN_ORDERED', 'FREE_SHORT', 'RATE_DIFFERS', 'QTY_NOT_RELEASED', 'SHORT_EXPIRY');--> statement-breakpoint
CREATE TYPE "commerce"."supplier_invoice_hold_status" AS ENUM('OPEN', 'RELEASED', 'RESOLVED');--> statement-breakpoint
CREATE TYPE "commerce"."supplier_invoice_line_type" AS ENUM('ITEM', 'CHARGE');--> statement-breakpoint
CREATE TYPE "commerce"."supplier_invoice_payment_status" AS ENUM('UNPAID', 'PARTIAL', 'PAID');--> statement-breakpoint
CREATE TYPE "commerce"."supplier_invoice_source" AS ENUM('ENTERED', 'SELF_BILLED');--> statement-breakpoint
ALTER TYPE "commerce"."inbound_delivery_source" ADD VALUE 'INVOICE';--> statement-breakpoint
CREATE TABLE "commerce"."purchase_events" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"purchase_id" uuid NOT NULL,
	"purchase_supplier_id" uuid,
	"action" varchar(50) NOT NULL,
	"step_before" varchar(30),
	"step_after" varchar(30),
	"document_type" varchar(50),
	"document_id" uuid,
	"reason" text,
	"actor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commerce"."purchase_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."purchase_item_allocations" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"purchase_item_id" uuid NOT NULL,
	"purchase_supplier_id" uuid NOT NULL,
	"supplier_quotation_item_id" uuid,
	"uom_id" uuid NOT NULL,
	"uom_qty" numeric(12,3) NOT NULL,
	"primary_uom_qty" numeric(12,3) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"unit_price" bigint,
	"scheme_buy_qty" numeric(12,3),
	"scheme_free_qty" numeric(12,3),
	"has_scheme" boolean DEFAULT false NOT NULL,
	"free_primary_qty" numeric(12,3) DEFAULT '0' NOT NULL,
	"purchase_order_item_id" uuid CONSTRAINT "uq_purchase_item_allocations_po_item" UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_purchase_item_allocations_item_supplier" UNIQUE("purchase_item_id","purchase_supplier_id"),
	CONSTRAINT "purchase_item_allocations_qty_chk" CHECK ("uom_qty" > 0 AND "primary_uom_qty" > 0),
	CONSTRAINT "purchase_item_allocations_scheme_chk" CHECK (("scheme_buy_qty" IS NULL) = ("scheme_free_qty" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "commerce"."purchase_item_allocations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."purchase_items" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"purchase_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"primary_qty" numeric(12,3) NOT NULL,
	"source" "commerce"."purchase_item_source" DEFAULT 'MANUAL'::"commerce"."purchase_item_source" NOT NULL,
	"source_id" uuid,
	"needed_by" date,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_purchase_items_purchase_item" UNIQUE("purchase_id","inventory_item_id"),
	CONSTRAINT "purchase_items_primary_qty_chk" CHECK ("primary_qty" > 0)
);
--> statement-breakpoint
ALTER TABLE "commerce"."purchase_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."purchase_suppliers" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"purchase_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"supplier_enrollment_id" uuid NOT NULL,
	"type" "commerce"."purchase_type" NOT NULL,
	"approval_enabled" boolean NOT NULL,
	"approval_threshold" bigint,
	"quality_check_enabled" boolean NOT NULL,
	"step" "commerce"."purchase_leg_step" DEFAULT 'SOURCING'::"commerce"."purchase_leg_step" NOT NULL,
	"status" "commerce"."purchase_leg_status" DEFAULT 'OPEN'::"commerce"."purchase_leg_status" NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_purchase_suppliers_purchase_supplier" UNIQUE("purchase_id","supplier_id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."purchase_suppliers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."purchases" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"legal_entity_id" uuid DEFAULT cast(nullif(current_setting('app.le_id', true), '') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(nullif(current_setting('app.site_id', true), '') as uuid) NOT NULL,
	"purchase_number" varchar(50) NOT NULL,
	"title" varchar(200) NOT NULL,
	"quotations_required" boolean DEFAULT false NOT NULL,
	"min_quotations" smallint DEFAULT 1 NOT NULL,
	"step" "commerce"."purchase_step" DEFAULT 'DEMAND'::"commerce"."purchase_step" NOT NULL,
	"status" "commerce"."purchase_status" DEFAULT 'OPEN'::"commerce"."purchase_status" NOT NULL,
	"needed_by" date,
	"notes" text,
	"created_by" uuid,
	"submitted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_purchases_org_purchase_number" UNIQUE("organization_id","purchase_number"),
	CONSTRAINT "purchases_min_quotations_chk" CHECK ("min_quotations" > 0)
);
--> statement-breakpoint
ALTER TABLE "commerce"."purchases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."supplier_invoice_holds" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"supplier_invoice_id" uuid NOT NULL,
	"supplier_invoice_line_id" uuid,
	"code" "commerce"."supplier_invoice_hold_code" NOT NULL,
	"detail" text NOT NULL,
	"blocks_payment" boolean NOT NULL,
	"status" "commerce"."supplier_invoice_hold_status" DEFAULT 'OPEN'::"commerce"."supplier_invoice_hold_status" NOT NULL,
	"released_by" uuid,
	"released_at" timestamp with time zone,
	"release_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_supplier_invoice_holds_invoice_line_code" UNIQUE NULLS NOT DISTINCT("supplier_invoice_id","supplier_invoice_line_id","code"),
	CONSTRAINT "supplier_invoice_holds_release_chk" CHECK ("status" <> 'RELEASED' OR ("release_reason" IS NOT NULL AND "released_by" IS NOT NULL AND "released_at" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_holds" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY "org_isolation" ON "commerce"."supplier_invoice_line_receipts";--> statement-breakpoint
DROP POLICY "reach_read" ON "commerce"."supplier_invoice_line_receipts";--> statement-breakpoint
DROP POLICY "owner_insert" ON "commerce"."supplier_invoice_line_receipts";--> statement-breakpoint
DROP POLICY "owner_update" ON "commerce"."supplier_invoice_line_receipts";--> statement-breakpoint
DROP POLICY "owner_delete" ON "commerce"."supplier_invoice_line_receipts";--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoices" DROP CONSTRAINT "supplier_invoices_purchase_order_id_purchase_orders_id_fkey";--> statement-breakpoint
DROP TABLE "commerce"."supplier_invoice_line_receipts";--> statement-breakpoint
DROP INDEX "commerce"."idx_supplier_invoices_po";--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipt_items" ADD COLUMN "inbound_delivery_line_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipt_items" ADD COLUMN "received_primary_qty" numeric(12,3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipt_items" ADD COLUMN "rejected_primary_qty" numeric(12,3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipts" ADD COLUMN "purchase_id" uuid;--> statement-breakpoint
ALTER TABLE "commerce"."inbound_deliveries" ADD COLUMN "purchase_id" uuid;--> statement-breakpoint
ALTER TABLE "commerce"."inbound_delivery_lines" ADD COLUMN "primary_uom_qty" numeric(12,3) NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_order_items" ADD COLUMN "free_primary_qty" numeric(12,3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_order_items" ADD COLUMN "received_primary_qty" numeric(12,3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_order_items" ADD COLUMN "rejected_primary_qty" numeric(12,3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_order_items" ADD COLUMN "billed_primary_qty" numeric(12,3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_order_items" ADD COLUMN "returned_primary_qty" numeric(12,3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_order_items" ADD COLUMN "cancelled_primary_qty" numeric(12,3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_orders" ADD COLUMN "purchase_id" uuid;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_orders" ADD COLUMN "receipt_status" "commerce"."purchase_order_receipt_status" DEFAULT 'NOT_RECEIVED'::"commerce"."purchase_order_receipt_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_orders" ADD COLUMN "billing_status" "commerce"."purchase_order_billing_status" DEFAULT 'NOTHING_TO_BILL'::"commerce"."purchase_order_billing_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_orders" ADD COLUMN "payment_term_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_enrollments" ADD COLUMN "purchase_type" "commerce"."purchase_type" DEFAULT 'STANDARD'::"commerce"."purchase_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_enrollments" ADD COLUMN "approval_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_enrollments" ADD COLUMN "approver_user_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_enrollments" ADD COLUMN "approval_threshold" bigint;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_enrollments" ADD COLUMN "quality_check_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_enrollments" ADD COLUMN "quarantine_location_id" uuid;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_enrollments" ADD COLUMN "default_receipt_location_id" uuid;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_enrollments" ADD COLUMN "price_tolerance_pct" numeric(5,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_enrollments" ADD COLUMN "qty_tolerance_pct" numeric(5,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_enrollments" ADD COLUMN "amount_tolerance" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" ADD COLUMN "line_type" "commerce"."supplier_invoice_line_type" DEFAULT 'ITEM'::"commerce"."supplier_invoice_line_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" ADD COLUMN "goods_receipt_item_id" uuid;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" ADD COLUMN "goods_receipt_lot_id" uuid;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" ADD COLUMN "billed_primary_qty" numeric(12,3);--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" ADD COLUMN "free_primary_qty" numeric(12,3);--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" ADD COLUMN "cost_category_id" uuid;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" ADD COLUMN "description" varchar(200);--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoices" ADD COLUMN "source" "commerce"."supplier_invoice_source" DEFAULT 'ENTERED'::"commerce"."supplier_invoice_source" NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoices" ADD COLUMN "payment_term_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoices" ADD COLUMN "due_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoices" ADD COLUMN "payment_status" "commerce"."supplier_invoice_payment_status" DEFAULT 'UNPAID'::"commerce"."supplier_invoice_payment_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoices" ADD COLUMN "open_hold_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_quotation_items" ADD COLUMN "purchase_item_id" uuid;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_quotations" ADD COLUMN "purchase_id" uuid;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_orders" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
DROP TYPE "commerce"."purchase_order_status";--> statement-breakpoint
CREATE TYPE "commerce"."purchase_order_status" AS ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'DRAFT', 'SENT', 'CONFIRMED', 'CLOSED', 'CANCELLED');--> statement-breakpoint
ALTER TABLE "commerce"."purchase_orders" ALTER COLUMN "status" SET DATA TYPE "commerce"."purchase_order_status" USING "status"::"commerce"."purchase_order_status";--> statement-breakpoint
ALTER TABLE "commerce"."purchase_orders" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"commerce"."purchase_order_status";--> statement-breakpoint
ALTER TABLE "commerce"."purchase_order_items" DROP COLUMN "received_quantity";--> statement-breakpoint
ALTER TABLE "commerce"."purchase_order_items" DROP COLUMN "free_qty";--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" DROP COLUMN "lot_number";--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" DROP COLUMN "expiry_date";--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" DROP COLUMN "mrp";--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" DROP COLUMN "flags";--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoices" DROP COLUMN "purchase_order_id";--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoices" DROP COLUMN "flag_count";--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoices" DROP COLUMN "flags";--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" ALTER COLUMN "purchase_order_item_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" ALTER COLUMN "inventory_item_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" ALTER COLUMN "uom_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" ALTER COLUMN "billed_qty" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" ALTER COLUMN "free_qty" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" ALTER COLUMN "free_qty" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_items_delivery_line" ON "commerce"."goods_receipt_items" ("inbound_delivery_line_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipts_purchase" ON "commerce"."goods_receipts" ("purchase_id");--> statement-breakpoint
CREATE INDEX "idx_inbound_deliveries_purchase" ON "commerce"."inbound_deliveries" ("purchase_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_events_purchase" ON "commerce"."purchase_events" ("purchase_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_purchase_item_allocations_supplier" ON "commerce"."purchase_item_allocations" ("purchase_supplier_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_item_allocations_quotation_item" ON "commerce"."purchase_item_allocations" ("supplier_quotation_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_purchase_items_source" ON "commerce"."purchase_items" ("source","source_id") WHERE "source_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_purchase_items_inventory_item" ON "commerce"."purchase_items" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_purchase" ON "commerce"."purchase_orders" ("purchase_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_suppliers_supplier" ON "commerce"."purchase_suppliers" ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_suppliers_enrollment" ON "commerce"."purchase_suppliers" ("supplier_enrollment_id");--> statement-breakpoint
CREATE INDEX "idx_purchases_site" ON "commerce"."purchases" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_purchases_status" ON "commerce"."purchases" ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_supplier_invoice_holds_invoice" ON "commerce"."supplier_invoice_holds" ("supplier_invoice_id","status");--> statement-breakpoint
CREATE INDEX "idx_supplier_invoice_lines_gr_item" ON "commerce"."supplier_invoice_lines" ("goods_receipt_item_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_invoice_lines_gr_lot" ON "commerce"."supplier_invoice_lines" ("goods_receipt_lot_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_quotation_items_purchase_item" ON "commerce"."supplier_quotation_items" ("purchase_item_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_quotations_purchase" ON "commerce"."supplier_quotations" ("purchase_id");--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_Mds23MnmYPBb_fkey" FOREIGN KEY ("inbound_delivery_line_id") REFERENCES "commerce"."inbound_delivery_lines"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipts" ADD CONSTRAINT "goods_receipts_purchase_id_purchases_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "commerce"."purchases"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."inbound_deliveries" ADD CONSTRAINT "inbound_deliveries_purchase_id_purchases_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "commerce"."purchases"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_events" ADD CONSTRAINT "purchase_events_purchase_id_purchases_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "commerce"."purchases"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_events" ADD CONSTRAINT "purchase_events_purchase_supplier_id_purchase_suppliers_id_fkey" FOREIGN KEY ("purchase_supplier_id") REFERENCES "commerce"."purchase_suppliers"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_item_allocations" ADD CONSTRAINT "purchase_item_allocations_6KJXZCmf1sB0_fkey" FOREIGN KEY ("purchase_item_id") REFERENCES "commerce"."purchase_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_item_allocations" ADD CONSTRAINT "purchase_item_allocations_4C8OA4Ebv9qA_fkey" FOREIGN KEY ("purchase_supplier_id") REFERENCES "commerce"."purchase_suppliers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_item_allocations" ADD CONSTRAINT "purchase_item_allocations_U2i4pr1bcH8W_fkey" FOREIGN KEY ("supplier_quotation_item_id") REFERENCES "commerce"."supplier_quotation_items"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_item_allocations" ADD CONSTRAINT "purchase_item_allocations_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "commerce"."uom"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_item_allocations" ADD CONSTRAINT "purchase_item_allocations_axewgZ5DYv8Q_fkey" FOREIGN KEY ("purchase_order_item_id") REFERENCES "commerce"."purchase_order_items"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_items" ADD CONSTRAINT "purchase_items_purchase_id_purchases_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "commerce"."purchases"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_items" ADD CONSTRAINT "purchase_items_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "commerce"."inventory_items"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_orders" ADD CONSTRAINT "purchase_orders_purchase_id_purchases_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "commerce"."purchases"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_orders" ADD CONSTRAINT "purchase_orders_payment_term_id_payment_terms_id_fkey" FOREIGN KEY ("payment_term_id") REFERENCES "commerce"."payment_terms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_suppliers" ADD CONSTRAINT "purchase_suppliers_purchase_id_purchases_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "commerce"."purchases"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_suppliers" ADD CONSTRAINT "purchase_suppliers_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "commerce"."suppliers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_suppliers" ADD CONSTRAINT "purchase_suppliers_1qbponxEpxAm_fkey" FOREIGN KEY ("supplier_enrollment_id") REFERENCES "commerce"."supplier_enrollments"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_enrollments" ADD CONSTRAINT "supplier_enrollments_quarantine_location_id_locations_id_fkey" FOREIGN KEY ("quarantine_location_id") REFERENCES "commerce"."locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_enrollments" ADD CONSTRAINT "supplier_enrollments_HA62T4kyr6do_fkey" FOREIGN KEY ("default_receipt_location_id") REFERENCES "commerce"."locations"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_holds" ADD CONSTRAINT "supplier_invoice_holds_yZuLY0XEbjQY_fkey" FOREIGN KEY ("supplier_invoice_id") REFERENCES "commerce"."supplier_invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_holds" ADD CONSTRAINT "supplier_invoice_holds_985i4QEN3x9Q_fkey" FOREIGN KEY ("supplier_invoice_line_id") REFERENCES "commerce"."supplier_invoice_lines"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" ADD CONSTRAINT "supplier_invoice_lines_2lIohWZa1BgL_fkey" FOREIGN KEY ("goods_receipt_item_id") REFERENCES "commerce"."goods_receipt_items"("id");--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" ADD CONSTRAINT "supplier_invoice_lines_36AR67joXROX_fkey" FOREIGN KEY ("goods_receipt_lot_id") REFERENCES "commerce"."goods_receipt_lots"("id");--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" ADD CONSTRAINT "supplier_invoice_lines_cost_category_id_cost_categories_id_fkey" FOREIGN KEY ("cost_category_id") REFERENCES "commerce"."cost_categories"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoices" ADD CONSTRAINT "supplier_invoices_payment_term_id_payment_terms_id_fkey" FOREIGN KEY ("payment_term_id") REFERENCES "commerce"."payment_terms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_quotation_items" ADD CONSTRAINT "supplier_quotation_items_LrBa6X1qP5uZ_fkey" FOREIGN KEY ("purchase_item_id") REFERENCES "commerce"."purchase_items"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_quotations" ADD CONSTRAINT "supplier_quotations_purchase_id_purchases_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "commerce"."purchases"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "commerce"."inbound_deliveries" ADD CONSTRAINT "inbound_deliveries_source_purchase_chk" CHECK ("source" = 'ANNOUNCED' OR "purchase_id" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "commerce"."supplier_enrollments" ADD CONSTRAINT "supplier_enrollments_approvers_chk" CHECK (NOT "approval_enabled" OR cardinality("approver_user_ids") > 0);--> statement-breakpoint
ALTER TABLE "commerce"."supplier_enrollments" ADD CONSTRAINT "supplier_enrollments_quarantine_chk" CHECK (NOT "quality_check_enabled" OR "quarantine_location_id" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "commerce"."supplier_enrollments" ADD CONSTRAINT "supplier_enrollments_tolerances_chk" CHECK ("price_tolerance_pct" >= 0 AND "qty_tolerance_pct" >= 0 AND "amount_tolerance" >= 0);--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" ADD CONSTRAINT "supplier_invoice_lines_item_chk" CHECK ("line_type" <> 'ITEM' OR ("purchase_order_item_id" IS NOT NULL AND "inventory_item_id" IS NOT NULL AND "uom_id" IS NOT NULL AND "billed_qty" IS NOT NULL AND "free_qty" IS NOT NULL AND "billed_primary_qty" IS NOT NULL AND "free_primary_qty" IS NOT NULL AND "cost_category_id" IS NULL));--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" ADD CONSTRAINT "supplier_invoice_lines_charge_chk" CHECK ("line_type" <> 'CHARGE' OR ("cost_category_id" IS NOT NULL AND "purchase_order_item_id" IS NULL AND "goods_receipt_item_id" IS NULL AND "goods_receipt_lot_id" IS NULL AND "inventory_item_id" IS NULL));--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" ADD CONSTRAINT "supplier_invoice_lines_receipt_chk" CHECK ("goods_receipt_lot_id" IS NULL OR "goods_receipt_item_id" IS NOT NULL);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."purchase_events" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "reach_read" ON "commerce"."purchase_events" AS RESTRICTIVE FOR SELECT TO public USING (exists (select 1 from commerce.purchases o where o.id = purchase_id));--> statement-breakpoint
CREATE POLICY "owner_insert" ON "commerce"."purchase_events" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (exists (select 1 from commerce.purchases o where o.id = purchase_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)));--> statement-breakpoint
CREATE POLICY "owner_update" ON "commerce"."purchase_events" AS RESTRICTIVE FOR UPDATE TO public USING (exists (select 1 from commerce.purchases o where o.id = purchase_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)));--> statement-breakpoint
CREATE POLICY "owner_delete" ON "commerce"."purchase_events" AS RESTRICTIVE FOR DELETE TO public USING (exists (select 1 from commerce.purchases o where o.id = purchase_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."purchase_item_allocations" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "reach_read" ON "commerce"."purchase_item_allocations" AS RESTRICTIVE FOR SELECT TO public USING (exists (select 1 from commerce.purchase_items p where p.id = purchase_item_id));--> statement-breakpoint
CREATE POLICY "owner_insert" ON "commerce"."purchase_item_allocations" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (exists (select 1 from commerce.purchase_items p join commerce.purchases o on o.id = p.purchase_id where p.id = purchase_item_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)));--> statement-breakpoint
CREATE POLICY "owner_update" ON "commerce"."purchase_item_allocations" AS RESTRICTIVE FOR UPDATE TO public USING (exists (select 1 from commerce.purchase_items p join commerce.purchases o on o.id = p.purchase_id where p.id = purchase_item_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)));--> statement-breakpoint
CREATE POLICY "owner_delete" ON "commerce"."purchase_item_allocations" AS RESTRICTIVE FOR DELETE TO public USING (exists (select 1 from commerce.purchase_items p join commerce.purchases o on o.id = p.purchase_id where p.id = purchase_item_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."purchase_items" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "reach_read" ON "commerce"."purchase_items" AS RESTRICTIVE FOR SELECT TO public USING (exists (select 1 from commerce.purchases o where o.id = purchase_id));--> statement-breakpoint
CREATE POLICY "owner_insert" ON "commerce"."purchase_items" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (exists (select 1 from commerce.purchases o where o.id = purchase_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)));--> statement-breakpoint
CREATE POLICY "owner_update" ON "commerce"."purchase_items" AS RESTRICTIVE FOR UPDATE TO public USING (exists (select 1 from commerce.purchases o where o.id = purchase_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)));--> statement-breakpoint
CREATE POLICY "owner_delete" ON "commerce"."purchase_items" AS RESTRICTIVE FOR DELETE TO public USING (exists (select 1 from commerce.purchases o where o.id = purchase_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."purchase_suppliers" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "reach_read" ON "commerce"."purchase_suppliers" AS RESTRICTIVE FOR SELECT TO public USING (exists (select 1 from commerce.purchases o where o.id = purchase_id));--> statement-breakpoint
CREATE POLICY "owner_insert" ON "commerce"."purchase_suppliers" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (exists (select 1 from commerce.purchases o where o.id = purchase_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)));--> statement-breakpoint
CREATE POLICY "owner_update" ON "commerce"."purchase_suppliers" AS RESTRICTIVE FOR UPDATE TO public USING (exists (select 1 from commerce.purchases o where o.id = purchase_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)));--> statement-breakpoint
CREATE POLICY "owner_delete" ON "commerce"."purchase_suppliers" AS RESTRICTIVE FOR DELETE TO public USING (exists (select 1 from commerce.purchases o where o.id = purchase_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."purchases" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "reach_read" ON "commerce"."purchases" AS RESTRICTIVE FOR SELECT TO public USING (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then site_id = any(string_to_array(nullif(current_setting('app.site_ids', true), ''), ',')::uuid[])
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then true
    else false
  end, false));--> statement-breakpoint
CREATE POLICY "owner_insert" ON "commerce"."purchases" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false));--> statement-breakpoint
CREATE POLICY "owner_update" ON "commerce"."purchases" AS RESTRICTIVE FOR UPDATE TO public USING (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)) WITH CHECK (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false));--> statement-breakpoint
CREATE POLICY "owner_delete" ON "commerce"."purchases" AS RESTRICTIVE FOR DELETE TO public USING (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."supplier_invoice_holds" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "reach_read" ON "commerce"."supplier_invoice_holds" AS RESTRICTIVE FOR SELECT TO public USING (exists (select 1 from commerce.supplier_invoices o where o.id = supplier_invoice_id));--> statement-breakpoint
CREATE POLICY "owner_insert" ON "commerce"."supplier_invoice_holds" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (exists (select 1 from commerce.supplier_invoices o where o.id = supplier_invoice_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)));--> statement-breakpoint
CREATE POLICY "owner_update" ON "commerce"."supplier_invoice_holds" AS RESTRICTIVE FOR UPDATE TO public USING (exists (select 1 from commerce.supplier_invoices o where o.id = supplier_invoice_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)));--> statement-breakpoint
CREATE POLICY "owner_delete" ON "commerce"."supplier_invoice_holds" AS RESTRICTIVE FOR DELETE TO public USING (exists (select 1 from commerce.supplier_invoices o where o.id = supplier_invoice_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)));