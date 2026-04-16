CREATE SCHEMA "vritti_core";
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS ltree WITH SCHEMA vritti_core;
--> statement-breakpoint
CREATE TYPE "vritti_core"."catalog_item_type" AS ENUM('PRODUCT', 'SERVICE');--> statement-breakpoint
CREATE TYPE "vritti_core"."conversion_status" AS ENUM('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "vritti_core"."credit_note_status" AS ENUM('DRAFT', 'ISSUED', 'PARTIALLY_APPLIED', 'FULLY_APPLIED');--> statement-breakpoint
CREATE TYPE "vritti_core"."credit_note_type" AS ENUM('PAYABLE', 'RECEIVABLE');--> statement-breakpoint
CREATE TYPE "vritti_core"."field_type" AS ENUM('text', 'number', 'boolean', 'select');--> statement-breakpoint
CREATE TYPE "vritti_core"."inventory_item_type" AS ENUM('MATERIAL', 'PRODUCT');--> statement-breakpoint
CREATE TYPE "vritti_core"."inventory_ledger_reference_type" AS ENUM('GOODS_RECEIPT', 'STOCK_ADJUSTMENT', 'CONVERSION', 'STOCK_TRANSFER', 'ORDER');--> statement-breakpoint
CREATE TYPE "vritti_core"."inventory_ledger_type" AS ENUM('GOODS_RECEIPT', 'ORDER_RESERVE', 'ORDER_DEDUCT', 'ORDER_CANCEL', 'ADJUSTMENT', 'CONVERSION_INPUT', 'CONVERSION_OUTPUT', 'TRANSFER_OUT', 'TRANSFER_IN', 'OPENING_STOCK');--> statement-breakpoint
CREATE TYPE "vritti_core"."invoice_party_type" AS ENUM('SUPPLIER', 'CUSTOMER', 'AGGREGATOR');--> statement-breakpoint
CREATE TYPE "vritti_core"."invoice_status" AS ENUM('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID');--> statement-breakpoint
CREATE TYPE "vritti_core"."invoice_type" AS ENUM('PAYABLE', 'RECEIVABLE');--> statement-breakpoint
CREATE TYPE "vritti_core"."modifier_selection_type" AS ENUM('SINGLE', 'MULTI');--> statement-breakpoint
CREATE TYPE "vritti_core"."order_item_status" AS ENUM('PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "vritti_core"."order_source" AS ENUM('ONLINE', 'WALK_IN');--> statement-breakpoint
CREATE TYPE "vritti_core"."order_status" AS ENUM('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "vritti_core"."order_type" AS ENUM('DINE_IN', 'TAKEAWAY', 'DELIVERY');--> statement-breakpoint
CREATE TYPE "vritti_core"."payment_method" AS ENUM('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'WALLET', 'ONLINE');--> statement-breakpoint
CREATE TYPE "vritti_core"."payment_status" AS ENUM('COMPLETED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "vritti_core"."purchase_order_status" AS ENUM('DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "vritti_core"."stock_adjustment_status" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "vritti_core"."stock_adjustment_type" AS ENUM('WASTE', 'DAMAGE', 'THEFT', 'EXPIRED', 'CORRECTION', 'PRODUCTION', 'OPENING_STOCK');--> statement-breakpoint
CREATE TYPE "vritti_core"."stock_transfer_status" AS ENUM('REQUESTED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "vritti_core"."tax_rate_type" AS ENUM('inclusive', 'exclusive');--> statement-breakpoint
CREATE TABLE "vritti_core"."items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"category_id" uuid,
	"type" "vritti_core"."catalog_item_type" NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"tax_group_id" uuid,
	"is_available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"attributes" jsonb DEFAULT '{}' NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_items_bu_code" UNIQUE("business_unit_id","code")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"image" varchar(255),
	"parent_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."item_option_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"value" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "uq_item_option_values_option_value" UNIQUE("option_id","value")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."item_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "uq_item_options_item_name" UNIQUE("item_id","name")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."item_variant_option_values" (
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"variant_id" uuid,
	"option_value_id" uuid,
	CONSTRAINT "item_variant_option_values_pkey" PRIMARY KEY("variant_id","option_value_id")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."item_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"bom_id" uuid,
	"sku" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"price" numeric(12,2) NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"manage_inventory" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"attributes" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_item_variants_item_sku" UNIQUE("item_id","sku")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."item_field_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"field_type" "vritti_core"."field_type" NOT NULL,
	"options" jsonb DEFAULT '[]' NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."item_field_definitions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."item_field_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"field_definition_id" uuid NOT NULL,
	"value" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."item_modifier_groups" (
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"item_id" uuid,
	"group_id" uuid,
	CONSTRAINT "item_modifier_groups_pkey" PRIMARY KEY("item_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."modifier_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"selection_type" "vritti_core"."modifier_selection_type" NOT NULL,
	"min_selections" integer DEFAULT 0 NOT NULL,
	"max_selections" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_modifier_groups_bu_name" UNIQUE("business_unit_id","name")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."modifier_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."modifier_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"additional_price" numeric(12,2) DEFAULT '0' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"attributes" jsonb DEFAULT '{}' NOT NULL,
	CONSTRAINT "uq_modifier_options_group_name" UNIQUE("group_id","name")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."tax_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."tax_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"tax_group_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"rate" numeric(5,2) NOT NULL,
	"type" "vritti_core"."tax_rate_type" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."uom" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"symbol" varchar(10) NOT NULL,
	"base_unit_id" uuid,
	"conversion_factor" double precision DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."uom" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(100) NOT NULL,
	"type" "vritti_core"."inventory_item_type" NOT NULL,
	"category_id" uuid NOT NULL,
	"description" varchar(500),
	"uom_id" uuid NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inventory_items_bu_code" UNIQUE("business_unit_id","code")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."storage_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"parent_id" uuid,
	"path" vritti_core.ltree NOT NULL,
	"sort_order" integer DEFAULT 1 NOT NULL,
	"area" varchar(100),
	"manager_id" uuid,
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_storage_locations_bu_code" UNIQUE("business_unit_id","code")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."storage_locations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."inventory_item_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"batch_number" varchar(100),
	"quantity" numeric(12,3) DEFAULT '0' NOT NULL,
	"reserved_quantity" numeric(12,3) DEFAULT '0' NOT NULL,
	"manufacturing_date" date,
	"expiry_date" date,
	"goods_receipt_item_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_batches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."storage_location_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"reorder_level" numeric(12,3) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_storage_location_configs" UNIQUE("inventory_item_id","location_id")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."storage_location_configs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."inventory_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"batch_id" uuid,
	"type" "vritti_core"."inventory_ledger_type" NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"reference_type" "vritti_core"."inventory_ledger_reference_type",
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
CREATE TABLE "vritti_core"."supplier_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"supplier_code" varchar(100),
	"unit_price" numeric(12,2),
	"uom_id" uuid NOT NULL,
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
	"rejection_reason" text,
	"batch_number" varchar(100),
	"manufacturing_date" date,
	"expiry_date" date
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
	"code" varchar(50) NOT NULL,
	"type" "vritti_core"."stock_adjustment_type" NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"status" "vritti_core"."stock_adjustment_status" DEFAULT 'DRAFT'::"vritti_core"."stock_adjustment_status" NOT NULL,
	"reason" text,
	"created_by_id" uuid NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."stock_adjustment_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"stock_adjustment_id" uuid NOT NULL,
	"created_by_id" uuid NOT NULL,
	"batch_id" uuid,
	"location_id" uuid,
	"quantity" numeric(12,3) NOT NULL,
	"batch_number" varchar(100),
	"is_balanced" boolean DEFAULT false NOT NULL,
	"manufacturing_date" date,
	"expiry_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."stock_adjustment_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"stock_adjustment_line_id" uuid NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_line_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
CREATE TABLE "vritti_core"."order_item_modifiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"modifier_group_id" uuid NOT NULL,
	"modifier_option_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"additional_price" numeric(12,2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"variant_name" varchar(255),
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(12,2) NOT NULL,
	"tax_rate" numeric(5,2) NOT NULL,
	"tax_amount" numeric(12,2) NOT NULL,
	"subtotal" numeric(12,2) NOT NULL,
	"total" numeric(12,2) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"type" "vritti_core"."order_type" NOT NULL,
	"channel" "vritti_core"."order_source" NOT NULL,
	"status" "vritti_core"."order_status" DEFAULT 'PENDING'::"vritti_core"."order_status" NOT NULL,
	"customer_name" varchar(255),
	"customer_phone" varchar(20),
	"delivery_address" text,
	"subtotal" numeric(12,2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(12,2) DEFAULT '0' NOT NULL,
	"service_charge" numeric(12,2) DEFAULT '0' NOT NULL,
	"delivery_charge" numeric(12,2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(12,2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(12,2) DEFAULT '0' NOT NULL,
	"notes" text,
	"external_order_id" varchar(100),
	"placed_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	"ready_at" timestamp,
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_orders_bu_number" UNIQUE("business_unit_id","order_number")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."inventory_item_batch_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"inventory_item_batch_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"quantity" numeric(12,3) DEFAULT '0' NOT NULL,
	"reserved_quantity" numeric(12,3) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inventory_batch_items_batch_item" UNIQUE("inventory_item_batch_id","inventory_item_id")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_batch_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_items_bu" ON "vritti_core"."items" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_items_category" ON "vritti_core"."items" ("category_id");--> statement-breakpoint
CREATE INDEX "idx_categories_bu" ON "vritti_core"."categories" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_categories_parent" ON "vritti_core"."categories" ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_item_variants_item" ON "vritti_core"."item_variants" ("item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_item_field_value" ON "vritti_core"."item_field_values" ("item_id","field_definition_id");--> statement-breakpoint
CREATE INDEX "idx_modifier_groups_bu" ON "vritti_core"."modifier_groups" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_modifier_options_group" ON "vritti_core"."modifier_options" ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tax_groups_bu_name_unique" ON "vritti_core"."tax_groups" ("business_unit_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_uom_bu_symbol" ON "vritti_core"."uom" ("business_unit_id","symbol");--> statement-breakpoint
CREATE INDEX "idx_uom_bu" ON "vritti_core"."uom" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_items_bu" ON "vritti_core"."inventory_items" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_items_category" ON "vritti_core"."inventory_items" ("category_id");--> statement-breakpoint
CREATE INDEX "idx_storage_locations_bu" ON "vritti_core"."storage_locations" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_storage_locations_parent" ON "vritti_core"."storage_locations" ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_batches_item" ON "vritti_core"."inventory_item_batches" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_batches_location" ON "vritti_core"."inventory_item_batches" ("location_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_batches_item_location" ON "vritti_core"."inventory_item_batches" ("inventory_item_id","location_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_batches_expiry" ON "vritti_core"."inventory_item_batches" ("expiry_date");--> statement-breakpoint
CREATE INDEX "idx_storage_location_configs_item" ON "vritti_core"."storage_location_configs" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_storage_location_configs_location" ON "vritti_core"."storage_location_configs" ("location_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_ledger_item" ON "vritti_core"."inventory_ledger" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_ledger_bu" ON "vritti_core"."inventory_ledger" ("business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_ledger_ref" ON "vritti_core"."inventory_ledger" ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_ledger_created" ON "vritti_core"."inventory_ledger" ("inventory_item_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_inventory_ledger_batch" ON "vritti_core"."inventory_ledger" ("batch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_bom_bu_code" ON "vritti_core"."bom" ("business_unit_id","code");--> statement-breakpoint
CREATE INDEX "idx_bom_bu" ON "vritti_core"."bom" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_bom_lines_bom" ON "vritti_core"."bom_lines" ("bom_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_items_supplier" ON "vritti_core"."supplier_items" ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_suppliers_bu" ON "vritti_core"."suppliers" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_order_items_po" ON "vritti_core"."purchase_order_items" ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_bu" ON "vritti_core"."purchase_orders" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_supplier" ON "vritti_core"."purchase_orders" ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_items_gr" ON "vritti_core"."goods_receipt_items" ("goods_receipt_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipts_po" ON "vritti_core"."goods_receipts" ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipts_bu" ON "vritti_core"."goods_receipts" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_conversion_inputs_conversion" ON "vritti_core"."conversion_inputs" ("conversion_id");--> statement-breakpoint
CREATE INDEX "idx_conversion_inputs_item" ON "vritti_core"."conversion_inputs" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_conversion_outputs_conversion" ON "vritti_core"."conversion_outputs" ("conversion_id");--> statement-breakpoint
CREATE INDEX "idx_conversion_outputs_item" ON "vritti_core"."conversion_outputs" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_conversions_bu" ON "vritti_core"."conversions" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_conversions_bom" ON "vritti_core"."conversions" ("bom_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustments_bu" ON "vritti_core"."stock_adjustments" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustments_item" ON "vritti_core"."stock_adjustments" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustments_status" ON "vritti_core"."stock_adjustments" ("status");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustment_lines_adjustment" ON "vritti_core"."stock_adjustment_lines" ("stock_adjustment_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustment_lines_batch" ON "vritti_core"."stock_adjustment_lines" ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_sa_line_items_line" ON "vritti_core"."stock_adjustment_line_items" ("stock_adjustment_line_id");--> statement-breakpoint
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
CREATE INDEX "idx_order_item_modifiers_item" ON "vritti_core"."order_item_modifiers" ("order_item_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_order" ON "vritti_core"."order_items" ("order_id");--> statement-breakpoint
CREATE INDEX "idx_orders_bu" ON "vritti_core"."orders" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "vritti_core"."orders" ("status");--> statement-breakpoint
CREATE INDEX "idx_inventory_batch_items_batch" ON "vritti_core"."inventory_item_batch_items" ("inventory_item_batch_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_batch_items_item" ON "vritti_core"."inventory_item_batch_items" ("inventory_item_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."item_variants" ADD CONSTRAINT "item_variants_bom_id_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "vritti_core"."bom"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."item_field_values" ADD CONSTRAINT "item_field_values_item_id_items_id_fkey" FOREIGN KEY ("item_id") REFERENCES "vritti_core"."items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."item_field_values" ADD CONSTRAINT "item_field_values_V0gaE4dkunFk_fkey" FOREIGN KEY ("field_definition_id") REFERENCES "vritti_core"."item_field_definitions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_rates" ADD CONSTRAINT "tax_rates_tax_group_id_tax_groups_id_fkey" FOREIGN KEY ("tax_group_id") REFERENCES "vritti_core"."tax_groups"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" ADD CONSTRAINT "inventory_items_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "vritti_core"."categories"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" ADD CONSTRAINT "inventory_items_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "vritti_core"."uom"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_batches" ADD CONSTRAINT "inventory_item_batches_IizScUrOf6zq_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_batches" ADD CONSTRAINT "inventory_item_batches_location_id_storage_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "vritti_core"."storage_locations"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_batches" ADD CONSTRAINT "inventory_item_batches_w3J0T1PiuGL4_fkey" FOREIGN KEY ("goods_receipt_item_id") REFERENCES "vritti_core"."goods_receipt_items"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."storage_location_configs" ADD CONSTRAINT "storage_location_configs_8BqhgfMaA2Jm_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."storage_location_configs" ADD CONSTRAINT "storage_location_configs_location_id_storage_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "vritti_core"."storage_locations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_ledger" ADD CONSTRAINT "inventory_ledger_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_ledger" ADD CONSTRAINT "inventory_ledger_batch_id_inventory_item_batches_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "vritti_core"."inventory_item_batches"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."bom_lines" ADD CONSTRAINT "bom_lines_bom_id_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "vritti_core"."bom"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."bom_lines" ADD CONSTRAINT "bom_lines_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_items" ADD CONSTRAINT "supplier_items_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "vritti_core"."suppliers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_items" ADD CONSTRAINT "supplier_items_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_items" ADD CONSTRAINT "supplier_items_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "vritti_core"."uom"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "vritti_core"."purchase_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "vritti_core"."suppliers"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_goods_receipt_id_goods_receipts_id_fkey" FOREIGN KEY ("goods_receipt_id") REFERENCES "vritti_core"."goods_receipts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_LfHoAU3Xn983_fkey" FOREIGN KEY ("purchase_order_item_id") REFERENCES "vritti_core"."purchase_order_items"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipts" ADD CONSTRAINT "goods_receipts_purchase_order_id_purchase_orders_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "vritti_core"."purchase_orders"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."conversion_inputs" ADD CONSTRAINT "conversion_inputs_conversion_id_conversions_id_fkey" FOREIGN KEY ("conversion_id") REFERENCES "vritti_core"."conversions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."conversion_inputs" ADD CONSTRAINT "conversion_inputs_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."conversion_outputs" ADD CONSTRAINT "conversion_outputs_conversion_id_conversions_id_fkey" FOREIGN KEY ("conversion_id") REFERENCES "vritti_core"."conversions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."conversion_outputs" ADD CONSTRAINT "conversion_outputs_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."conversions" ADD CONSTRAINT "conversions_bom_id_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "vritti_core"."bom"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustments" ADD CONSTRAINT "stock_adjustments_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lines" ADD CONSTRAINT "stock_adjustment_lines_V8pV4VOOh3IT_fkey" FOREIGN KEY ("stock_adjustment_id") REFERENCES "vritti_core"."stock_adjustments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lines" ADD CONSTRAINT "stock_adjustment_lines_batch_id_inventory_item_batches_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "vritti_core"."inventory_item_batches"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lines" ADD CONSTRAINT "stock_adjustment_lines_location_id_storage_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "vritti_core"."storage_locations"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_line_items" ADD CONSTRAINT "stock_adjustment_line_items_BAKtyY4jjSIv_fkey" FOREIGN KEY ("stock_adjustment_line_id") REFERENCES "vritti_core"."stock_adjustment_lines"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_transfers" ADD CONSTRAINT "stock_transfers_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "vritti_core"."invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "vritti_core"."invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."credit_note_applications" ADD CONSTRAINT "credit_note_applications_credit_note_id_credit_notes_id_fkey" FOREIGN KEY ("credit_note_id") REFERENCES "vritti_core"."credit_notes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."credit_note_applications" ADD CONSTRAINT "credit_note_applications_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "vritti_core"."invoices"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_order_item_id_order_items_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "vritti_core"."order_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "vritti_core"."orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."order_items" ADD CONSTRAINT "order_items_item_id_items_id_fkey" FOREIGN KEY ("item_id") REFERENCES "vritti_core"."items"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."order_items" ADD CONSTRAINT "order_items_variant_id_item_variants_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "vritti_core"."item_variants"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_batch_items" ADD CONSTRAINT "inventory_item_batch_items_4lK4wYzHV5eA_fkey" FOREIGN KEY ("inventory_item_batch_id") REFERENCES "vritti_core"."inventory_item_batches"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_batch_items" ADD CONSTRAINT "inventory_item_batch_items_kVm5wGvCOy0l_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE RESTRICT;--> statement-breakpoint
CREATE VIEW "vritti_core"."inventory_levels" AS (select "vritti_core"."inventory_item_batches"."inventory_item_id", "vritti_core"."inventory_item_batches"."location_id", CAST(SUM("vritti_core"."inventory_item_batches"."quantity") AS TEXT) as "stocked_quantity", CAST(SUM("vritti_core"."inventory_item_batches"."reserved_quantity") AS TEXT) as "reserved_quantity", CAST(SUM("vritti_core"."inventory_item_batches"."quantity" - "vritti_core"."inventory_item_batches"."reserved_quantity") AS TEXT) as "available_quantity", "vritti_core"."storage_location_configs"."reorder_level" from "vritti_core"."inventory_item_batches" left join "vritti_core"."storage_location_configs" on "vritti_core"."inventory_item_batches"."inventory_item_id" = "vritti_core"."storage_location_configs"."inventory_item_id" AND "vritti_core"."inventory_item_batches"."location_id" = "vritti_core"."storage_location_configs"."location_id" group by "vritti_core"."inventory_item_batches"."inventory_item_id", "vritti_core"."inventory_item_batches"."location_id", "vritti_core"."storage_location_configs"."reorder_level");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."items" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."items" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."items" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."items" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."items" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."categories" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."categories" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."categories" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."categories" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."categories" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."item_field_definitions" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."item_field_definitions" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."item_field_definitions" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."item_field_definitions" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."item_field_definitions" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."modifier_groups" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."modifier_groups" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."modifier_groups" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."modifier_groups" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."modifier_groups" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."tax_groups" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."tax_groups" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."tax_groups" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."tax_groups" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."tax_groups" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."uom" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."uom" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."uom" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."uom" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."uom" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."inventory_items" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."inventory_items" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."inventory_items" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."inventory_items" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."inventory_items" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."storage_locations" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."storage_locations" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."storage_locations" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."storage_locations" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."storage_locations" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."inventory_item_batches" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."inventory_item_batches" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."inventory_item_batches" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."inventory_item_batches" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."inventory_item_batches" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."storage_location_configs" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."storage_location_configs" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."storage_location_configs" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."storage_location_configs" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."storage_location_configs" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."bom" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."bom" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."bom" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."bom" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."bom" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
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
CREATE POLICY "bu_delete" ON "vritti_core"."goods_receipts" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
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
CREATE POLICY "org_isolation" ON "vritti_core"."stock_adjustment_lines" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."stock_adjustment_lines" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."stock_adjustment_lines" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."stock_adjustment_lines" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."stock_adjustment_lines" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."stock_adjustment_line_items" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."stock_adjustment_line_items" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."stock_adjustment_line_items" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."stock_adjustment_line_items" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."stock_adjustment_line_items" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
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
CREATE POLICY "bu_delete" ON "vritti_core"."credit_notes" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."orders" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."orders" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."orders" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."orders" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."orders" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."inventory_item_batch_items" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."inventory_item_batch_items" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."inventory_item_batch_items" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."inventory_item_batch_items" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."inventory_item_batch_items" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);
