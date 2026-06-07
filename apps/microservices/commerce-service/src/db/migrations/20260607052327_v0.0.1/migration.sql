CREATE SCHEMA IF NOT EXISTS "vritti_core";
--> statement-breakpoint
CREATE TYPE "vritti_core"."conversion_status" AS ENUM('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "vritti_core"."cost_category_kind" AS ENUM('ITEM', 'FREIGHT', 'DUTY', 'INSURANCE', 'SERVICE', 'OTHER');--> statement-breakpoint
CREATE TYPE "vritti_core"."cost_distribution_method" AS ENUM('by_value', 'by_quantity', 'equal');--> statement-breakpoint
CREATE TYPE "vritti_core"."cost_source_type" AS ENUM('goods_receipt', 'stock_adjustment', 'stock_transfer', 'manual_adjustment');--> statement-breakpoint
CREATE TYPE "vritti_core"."credit_note_status" AS ENUM('DRAFT', 'ISSUED', 'PARTIALLY_APPLIED', 'FULLY_APPLIED');--> statement-breakpoint
CREATE TYPE "vritti_core"."credit_note_type" AS ENUM('PAYABLE', 'RECEIVABLE');--> statement-breakpoint
CREATE TYPE "vritti_core"."exchange_rate_type" AS ENUM('FIXED', 'VARIABLE');--> statement-breakpoint
CREATE TYPE "vritti_core"."field_type" AS ENUM('text', 'number', 'boolean', 'select');--> statement-breakpoint
CREATE TYPE "vritti_core"."fulfilment_type" AS ENUM('STOCK', 'SERVICE', 'COMPOSITE');--> statement-breakpoint
CREATE TYPE "vritti_core"."goods_receipt_status" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "vritti_core"."inventory_item_ledger_reference_type" AS ENUM('GOODS_RECEIPT', 'STOCK_ADJUSTMENT', 'CONVERSION', 'STOCK_TRANSFER', 'ORDER');--> statement-breakpoint
CREATE TYPE "vritti_core"."inventory_item_ledger_type" AS ENUM('GOODS_RECEIPT', 'ORDER_RESERVE', 'ORDER_DEDUCT', 'ORDER_CANCEL', 'ADJUSTMENT', 'CONVERSION_INPUT', 'CONVERSION_OUTPUT', 'TRANSFER_OUT', 'TRANSFER_IN', 'OPENING_STOCK');--> statement-breakpoint
CREATE TYPE "vritti_core"."inventory_item_type" AS ENUM('RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE');--> statement-breakpoint
CREATE TYPE "vritti_core"."inventory_pick_strategy" AS ENUM('none', 'fifo', 'fefo');--> statement-breakpoint
CREATE TYPE "vritti_core"."inventory_tracking" AS ENUM('quantity', 'lot', 'lot_serial', 'serial');--> statement-breakpoint
CREATE TYPE "vritti_core"."invoice_party_type" AS ENUM('SUPPLIER', 'CUSTOMER', 'AGGREGATOR');--> statement-breakpoint
CREATE TYPE "vritti_core"."invoice_status" AS ENUM('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID');--> statement-breakpoint
CREATE TYPE "vritti_core"."invoice_type" AS ENUM('PAYABLE', 'RECEIVABLE');--> statement-breakpoint
CREATE TYPE "vritti_core"."location_role" AS ENUM('STORAGE', 'RESERVED_STORAGE', 'ZONE');--> statement-breakpoint
CREATE TYPE "vritti_core"."modifier_selection_type" AS ENUM('SINGLE', 'MULTI');--> statement-breakpoint
CREATE TYPE "vritti_core"."order_item_status" AS ENUM('PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "vritti_core"."order_source" AS ENUM('ONLINE', 'WALK_IN');--> statement-breakpoint
CREATE TYPE "vritti_core"."order_status" AS ENUM('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "vritti_core"."order_type" AS ENUM('DINE_IN', 'TAKEAWAY', 'DELIVERY');--> statement-breakpoint
CREATE TYPE "vritti_core"."payment_method" AS ENUM('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'WALLET', 'ONLINE');--> statement-breakpoint
CREATE TYPE "vritti_core"."payment_status" AS ENUM('COMPLETED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "vritti_core"."purchase_order_status" AS ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "vritti_core"."sales_channel_kind" AS ENUM('IN_STORE', 'ONLINE', 'ZOMATO', 'SWIGGY', 'OTHER');--> statement-breakpoint
CREATE TYPE "vritti_core"."quant_item_status" AS ENUM('AVAILABLE', 'RESERVED', 'CONSUMED');--> statement-breakpoint
CREATE TYPE "vritti_core"."stock_adjustment_status" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "vritti_core"."stock_adjustment_type" AS ENUM('WASTE', 'DAMAGE', 'THEFT', 'EXPIRED', 'CORRECTION', 'OPENING_STOCK');--> statement-breakpoint
CREATE TYPE "vritti_core"."stock_transfer_status" AS ENUM('REQUESTED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "vritti_core"."tax_id_type" AS ENUM('GST', 'VAT', 'EIN', 'SALES_TAX', 'OTHER');--> statement-breakpoint
CREATE TYPE "vritti_core"."tax_rate_type" AS ENUM('inclusive', 'exclusive');--> statement-breakpoint
CREATE SEQUENCE "vritti_core"."goods_receipt_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "vritti_core"."order_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "vritti_core"."purchase_order_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "vritti_core"."stock_adjustment_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "vritti_core"."bom" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."bom" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."bom_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"bom_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"required_quantity" numeric(12,3) NOT NULL,
	CONSTRAINT "uq_bom_lines_bom_item" UNIQUE("bom_id","inventory_item_id")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."catalog_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"catalog_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_catalog_channels_bu_channel" UNIQUE("business_unit_id","channel_id")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."catalog_channels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."catalogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"name" varchar(255) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"tax_inclusive" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."catalogs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"name" varchar(255) NOT NULL,
	"image" varchar(255),
	"parent_id" uuid,
	"path_label" varchar(255) NOT NULL,
	"path" vritti_core.ltree NOT NULL,
	"path_breadcrumb" text GENERATED ALWAYS AS (vritti_core.format_ltree_path(path)) STORED,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_categories_parent_path_label" UNIQUE("parent_id","path_label")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."conversion_inputs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"conversion_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"wastage_quantity" numeric(12,3) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."conversion_outputs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"conversion_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"wastage_quantity" numeric(12,3) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"bom_id" uuid,
	"status" "vritti_core"."conversion_status" DEFAULT 'DRAFT'::"vritti_core"."conversion_status" NOT NULL,
	"produced_by" uuid,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."conversions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."cost_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"kind" "vritti_core"."cost_category_kind" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_cost_categories_org_code" UNIQUE("organization_id","code")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."cost_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."credit_note_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"credit_note_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."credit_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"type" "vritti_core"."credit_note_type" NOT NULL,
	"party_type" "vritti_core"."invoice_party_type" NOT NULL,
	"party_id" uuid,
	"party_name" varchar(255) NOT NULL,
	"credit_note_number" varchar(50) NOT NULL,
	"amount" bigint NOT NULL,
	"applied_amount" bigint DEFAULT 0 NOT NULL,
	"remaining" bigint NOT NULL,
	"reason" text,
	"status" "vritti_core"."credit_note_status" DEFAULT 'DRAFT'::"vritti_core"."credit_note_status" NOT NULL,
	"issued_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_credit_notes_bu_number" UNIQUE("business_unit_id","credit_note_number")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."credit_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(32),
	"email" varchar(255),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."customers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."document_counters" (
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"counter_key" varchar(120) NOT NULL,
	"last_number" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."document_counters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."goods_receipt_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"goods_receipt_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"uom_id" uuid NOT NULL,
	"ordered_qty" numeric(12,3) DEFAULT '0' NOT NULL,
	"scheme_buy_qty" numeric(12,3),
	"scheme_free_qty" numeric(12,3),
	"has_scheme" boolean DEFAULT false NOT NULL,
	"free_qty" numeric(12,3) DEFAULT '0' NOT NULL,
	"total_qty" numeric(12,3) DEFAULT '0' NOT NULL,
	"rejected_quantity" numeric(12,3) DEFAULT '0' NOT NULL,
	"unit_price" bigint,
	"primary_uom_unit_price" bigint,
	"unit_cost" bigint,
	"currency_code" varchar(3),
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_goods_receipt_items_gr_item_uom" UNIQUE("goods_receipt_id","inventory_item_id","uom_id")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."goods_receipt_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"goods_receipt_line_id" uuid NOT NULL,
	"serial_number" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_goods_receipt_line_items_line_serial" UNIQUE("goods_receipt_line_id","serial_number")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_line_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."goods_receipt_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"goods_receipt_item_id" uuid NOT NULL,
	"goods_receipt_lot_id" uuid,
	"location_id" uuid NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"primary_uom_qty" numeric(12,3) NOT NULL,
	"resolved_quant_id" uuid,
	"is_balanced" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_goods_receipt_lines_item_lot_location" UNIQUE NULLS NOT DISTINCT("goods_receipt_item_id","goods_receipt_lot_id","location_id")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."goods_receipt_lots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"goods_receipt_item_id" uuid NOT NULL,
	"lot_number" varchar(100) NOT NULL,
	"manufacturing_date" timestamp with time zone,
	"expiry_date" timestamp with time zone NOT NULL,
	"resolved_lot_id" uuid,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_goods_receipt_lots_item_lot" UNIQUE("goods_receipt_item_id","lot_number"),
	CONSTRAINT "ck_goods_receipt_lots_expiry_after_mfg" CHECK ("manufacturing_date" IS NULL OR "expiry_date" > "manufacturing_date")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_lots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."goods_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"supplier_id" uuid NOT NULL,
	"gr_number" varchar(50) NOT NULL,
	"status" "vritti_core"."goods_receipt_status" DEFAULT 'DRAFT'::"vritti_core"."goods_receipt_status" NOT NULL,
	"purchase_order_id" uuid,
	"exchange_rate" numeric(18,6) DEFAULT '1' NOT NULL,
	"received_date" timestamp with time zone NOT NULL,
	"notes" text,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_goods_receipts_org_gr_number" UNIQUE("organization_id","gr_number")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."inventory_item_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"category_id" uuid NOT NULL,
	"total_amount" bigint NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"source_type" "vritti_core"."cost_source_type" NOT NULL,
	"source_id" uuid NOT NULL,
	"distribution_method" "vritti_core"."cost_distribution_method" DEFAULT 'by_value'::"vritti_core"."cost_distribution_method" NOT NULL,
	"unallocated_amount" bigint DEFAULT 0 NOT NULL,
	"vendor_ref" varchar(100),
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_costs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."inventory_item_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"type" "vritti_core"."inventory_item_ledger_type" NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"reference_type" "vritti_core"."inventory_item_ledger_reference_type",
	"reference_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."inventory_item_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"reorder_level" numeric(12,3) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inventory_item_locations" UNIQUE("inventory_item_id","location_id")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_locations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."inventory_item_lots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"lot_number" varchar(100) NOT NULL,
	"manufacturing_date" timestamp with time zone,
	"expiry_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inventory_item_lots_org_item_number" UNIQUE("organization_id","inventory_item_id","lot_number"),
	CONSTRAINT "ck_inventory_item_lots_expiry_after_mfg" CHECK ("manufacturing_date" IS NULL OR "expiry_date" > "manufacturing_date")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_lots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."inventory_item_quant_costs" (
	"quant_id" uuid,
	"cost_id" uuid,
	"allocated_amount" bigint NOT NULL,
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pk_inventory_item_quant_costs" PRIMARY KEY("quant_id","cost_id")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_quant_costs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."inventory_item_quants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"lot_id" uuid,
	"supplier_id" uuid,
	"quantity" numeric(12,3) DEFAULT '0' NOT NULL,
	"reserved_quantity" numeric(12,3) DEFAULT '0' NOT NULL,
	"unit_cost" bigint NOT NULL,
	"cost_currency" varchar(3),
	"quant_cost" bigint DEFAULT 0 NOT NULL,
	"quant_value" bigint DEFAULT 0 NOT NULL,
	"source_type" "vritti_core"."cost_source_type",
	"source_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_inventory_item_quants_unit_cost_positive" CHECK ("unit_cost" > 0)
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_quants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."inventory_item_serials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"inventory_item_quant_id" uuid,
	"inventory_item_id" uuid NOT NULL,
	"serial_number" varchar(100) NOT NULL,
	"status" "vritti_core"."quant_item_status" DEFAULT 'AVAILABLE'::"vritti_core"."quant_item_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inventory_item_serials_serial" UNIQUE("organization_id","inventory_item_id","serial_number")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_serials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."inventory_item_uom_conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"uom_id" uuid NOT NULL,
	"primary_uom_qty" integer NOT NULL,
	"uom_qty" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_iiuc_primary_uom_qty_positive" CHECK ("primary_uom_qty" > 0),
	CONSTRAINT "chk_iiuc_uom_qty_positive" CHECK ("uom_qty" > 0)
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(100) NOT NULL,
	"type" "vritti_core"."inventory_item_type" NOT NULL,
	"tracking" "vritti_core"."inventory_tracking" DEFAULT 'lot'::"vritti_core"."inventory_tracking" NOT NULL,
	"pick_strategy" "vritti_core"."inventory_pick_strategy" DEFAULT 'none'::"vritti_core"."inventory_pick_strategy" NOT NULL,
	"category_id" uuid NOT NULL,
	"description" varchar(500),
	"uom_id" uuid NOT NULL,
	"purchase_tax_group_id" uuid,
	"hsn_code" varchar(20),
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inventory_items_bu_code" UNIQUE("business_unit_id","code")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" varchar(255) NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"unit_price" bigint NOT NULL,
	"tax_amount" bigint DEFAULT 0 NOT NULL,
	"total" bigint NOT NULL,
	"reference_item_id" uuid
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"type" "vritti_core"."invoice_type" NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"party_type" "vritti_core"."invoice_party_type" NOT NULL,
	"party_id" uuid,
	"party_name" varchar(255) NOT NULL,
	"reference_type" varchar(50),
	"reference_id" uuid,
	"subtotal" bigint NOT NULL,
	"tax_amount" bigint DEFAULT 0 NOT NULL,
	"discount_amount" bigint DEFAULT 0 NOT NULL,
	"total_amount" bigint NOT NULL,
	"paid_amount" bigint DEFAULT 0 NOT NULL,
	"balance" bigint NOT NULL,
	"status" "vritti_core"."invoice_status" DEFAULT 'DRAFT'::"vritti_core"."invoice_status" NOT NULL,
	"payment_terms" varchar(50),
	"issued_date" timestamp with time zone,
	"due_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_invoices_bu_number" UNIQUE("business_unit_id","invoice_number")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."invoices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."item_field_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"name" varchar(100) NOT NULL,
	"field_type" "vritti_core"."field_type" NOT NULL,
	"options" jsonb DEFAULT '[]' NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."item_field_definitions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."item_field_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"item_id" uuid NOT NULL,
	"field_definition_id" uuid NOT NULL,
	"value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"parent_id" uuid,
	"path" vritti_core.ltree NOT NULL,
	"path_breadcrumb" text GENERATED ALWAYS AS (vritti_core.format_ltree_path(path)) STORED,
	"sort_order" integer DEFAULT 1 NOT NULL,
	"area" varchar(100),
	"manager_id" uuid,
	"address" text,
	"location_role" "vritti_core"."location_role" DEFAULT 'STORAGE'::"vritti_core"."location_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_locations_bu_parent_code" UNIQUE("business_unit_id","parent_id","code")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."locations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."modifier_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"catalog_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"selection_type" "vritti_core"."modifier_selection_type" NOT NULL,
	"min_selections" integer DEFAULT 0 NOT NULL,
	"max_selections" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_modifier_groups_catalog_name" UNIQUE("catalog_id","name")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."modifier_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."modifier_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"group_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"additional_price" bigint DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"attributes" jsonb DEFAULT '{}' NOT NULL,
	CONSTRAINT "uq_modifier_options_group_name" UNIQUE("group_id","name")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."offering_modifier_groups" (
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"offering_id" uuid,
	"group_id" uuid,
	CONSTRAINT "offering_modifier_groups_pkey" PRIMARY KEY("offering_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."offering_options" (
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"offering_id" uuid,
	"variant_option_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "offering_options_pkey" PRIMARY KEY("offering_id","variant_option_id")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."offering_variant_components" (
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"offering_variant_id" uuid,
	"inventory_item_id" uuid,
	"quantity" numeric(12,3) DEFAULT '1' NOT NULL,
	CONSTRAINT "offering_variant_components_pkey" PRIMARY KEY("offering_variant_id","inventory_item_id")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_variant_components" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."offering_variant_option_values" (
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"offering_variant_id" uuid,
	"variant_option_value_id" uuid,
	CONSTRAINT "offering_variant_option_values_pkey" PRIMARY KEY("offering_variant_id","variant_option_value_id")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."offering_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"offering_id" uuid NOT NULL,
	"sku" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"price" bigint NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"attributes" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_offering_variants_offering_sku" UNIQUE("offering_id","sku")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."offerings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"catalog_id" uuid NOT NULL,
	"category_id" uuid,
	"fulfilment_type" "vritti_core"."fulfilment_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"sales_tax_group_id" uuid,
	"is_available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"attributes" jsonb DEFAULT '{}' NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."offerings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."order_item_modifiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"order_item_id" uuid NOT NULL,
	"modifier_group_id" uuid NOT NULL,
	"modifier_option_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"additional_price" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"order_id" uuid NOT NULL,
	"offering_id" uuid NOT NULL,
	"offering_variant_id" uuid NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"variant_name" varchar(255),
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" bigint NOT NULL,
	"tax_rate" numeric(5,2) NOT NULL,
	"tax_amount" bigint NOT NULL,
	"subtotal" bigint NOT NULL,
	"total" bigint NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"type" "vritti_core"."order_type" NOT NULL,
	"channel" "vritti_core"."order_source" NOT NULL,
	"channel_id" uuid,
	"status" "vritti_core"."order_status" DEFAULT 'PENDING'::"vritti_core"."order_status" NOT NULL,
	"customer_id" uuid,
	"customer_name" varchar(255),
	"customer_phone" varchar(20),
	"delivery_address" text,
	"subtotal" bigint DEFAULT 0 NOT NULL,
	"tax_amount" bigint DEFAULT 0 NOT NULL,
	"service_charge" bigint DEFAULT 0 NOT NULL,
	"delivery_charge" bigint DEFAULT 0 NOT NULL,
	"discount_amount" bigint DEFAULT 0 NOT NULL,
	"total_amount" bigint DEFAULT 0 NOT NULL,
	"notes" text,
	"external_order_id" varchar(100),
	"placed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"ready_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_orders_org_number" UNIQUE("organization_id","order_number")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"method" "vritti_core"."payment_method" NOT NULL,
	"reference" varchar(255),
	"status" "vritti_core"."payment_status" DEFAULT 'COMPLETED'::"vritti_core"."payment_status" NOT NULL,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."pos_terminals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"location_id" uuid NOT NULL,
	"catalog_id" uuid,
	"description" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_pos_terminals_bu_code" UNIQUE("business_unit_id","code")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."pos_terminals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."purchase_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"uom_id" uuid NOT NULL,
	"uom_qty" numeric(12,3) NOT NULL,
	"received_quantity" numeric(12,3) DEFAULT '0' NOT NULL,
	"scheme_buy_qty" numeric(12,3),
	"scheme_free_qty" numeric(12,3),
	"has_scheme" boolean DEFAULT false NOT NULL,
	"free_qty" numeric(12,3) DEFAULT '0' NOT NULL,
	"primary_uom_qty" numeric(12,3) NOT NULL,
	"primary_uom_unit_price" bigint NOT NULL,
	"unit_price" bigint NOT NULL,
	"total_price" bigint NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	CONSTRAINT "uq_purchase_order_items_po_item_uom" UNIQUE("purchase_order_id","inventory_item_id","uom_id")
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"supplier_id" uuid NOT NULL,
	"po_number" varchar(50) NOT NULL,
	"status" "vritti_core"."purchase_order_status" DEFAULT 'DRAFT'::"vritti_core"."purchase_order_status" NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"exchange_rate" numeric(18,6) DEFAULT '1',
	"exchange_rate_type" "vritti_core"."exchange_rate_type" DEFAULT 'FIXED'::"vritti_core"."exchange_rate_type" NOT NULL,
	"order_date" date NOT NULL,
	"expected_by" timestamp with time zone,
	"timezone" varchar(50) DEFAULT current_setting('app.bu_timezone') NOT NULL,
	"notes" text,
	"total_amount" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_purchase_orders_org_po_number" UNIQUE("organization_id","po_number")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."sales_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"kind" "vritti_core"."sales_channel_kind" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_sales_channels_org_code" UNIQUE("organization_id","code")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."sales_channels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."stock_adjustment_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"stock_adjustment_line_id" uuid NOT NULL,
	"serial_number" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_stock_adjustment_line_items_line_serial" UNIQUE("stock_adjustment_line_id","serial_number")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_line_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."stock_adjustment_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"stock_adjustment_id" uuid NOT NULL,
	"stock_adjustment_lot_id" uuid,
	"location_id" uuid,
	"quant_id" uuid,
	"uom_id" uuid NOT NULL,
	"uom_qty" numeric(12,3) NOT NULL,
	"primary_uom_qty" numeric(12,3) NOT NULL,
	"resolved_quant_id" uuid,
	"is_balanced" boolean DEFAULT true NOT NULL,
	"write_off_amount" bigint DEFAULT 0 NOT NULL,
	"write_off_currency" varchar(3),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_line_intent" CHECK (("location_id" IS NOT NULL AND "quant_id" IS NULL)
       OR ("location_id" IS NULL AND "quant_id" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."stock_adjustment_lots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"stock_adjustment_id" uuid NOT NULL,
	"lot_number" varchar(100) NOT NULL,
	"manufacturing_date" timestamp with time zone,
	"expiry_date" timestamp with time zone NOT NULL,
	"resolved_lot_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_stock_adjustment_lots_adj_lot" UNIQUE("stock_adjustment_id","lot_number"),
	CONSTRAINT "ck_stock_adjustment_lots_expiry_after_mfg" CHECK ("manufacturing_date" IS NULL OR "expiry_date" > "manufacturing_date")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."stock_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"type" "vritti_core"."stock_adjustment_type" NOT NULL,
	"status" "vritti_core"."stock_adjustment_status" DEFAULT 'DRAFT'::"vritti_core"."stock_adjustment_status" NOT NULL,
	"reason" text,
	"unit_cost" bigint,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_stock_adjustments_org_code" UNIQUE("organization_id","code")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."stock_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"from_bu_id" uuid NOT NULL,
	"to_bu_id" uuid NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"status" "vritti_core"."stock_transfer_status" DEFAULT 'REQUESTED'::"vritti_core"."stock_transfer_status" NOT NULL,
	"requested_by" uuid,
	"received_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_transfers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."supplier_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"supplier_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"alternate_phone" varchar(20),
	"email" varchar(255),
	"alternate_email" varchar(255),
	"designation" varchar(100),
	"notes" varchar(500),
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."supplier_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"supplier_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"supplier_item_code" varchar(100),
	"unit_price" bigint NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"uom_id" uuid NOT NULL,
	"min_order_quantity" integer,
	"lead_time_days" integer,
	"scheme_buy_qty" numeric(12,3),
	"scheme_free_qty" numeric(12,3),
	"has_scheme" boolean DEFAULT false NOT NULL,
	"is_preferred" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(100) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"contact_name" varchar(255),
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"website" varchar(255),
	"address" varchar(500),
	"tax_id" varchar(15),
	"tax_id_type" "vritti_core"."tax_id_type",
	"payment_terms" varchar(50),
	"lead_time_days" integer,
	"notes" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_suppliers_id_currency" UNIQUE("id","currency_code")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."tax_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"dimension_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"symbol" varchar(10) NOT NULL,
	"base_unit_id" uuid,
	"base_uom_qty" integer DEFAULT 1 NOT NULL,
	"uom_qty" integer DEFAULT 1 NOT NULL,
	"allow_decimal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_uom_base_uom_qty_positive" CHECK ("base_uom_qty" > 0),
	CONSTRAINT "chk_uom_uom_qty_positive" CHECK ("uom_qty" > 0)
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."uom" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."uom_dimensions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id') NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_uom_dimensions_bu_code" UNIQUE("business_unit_id","code")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."uom_dimensions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."variant_option_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"variant_option_id" uuid NOT NULL,
	"value" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "uq_variant_option_values_option_value" UNIQUE("variant_option_id","value")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."variant_option_values" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."variant_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id') NOT NULL,
	"catalog_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_variant_options_catalog_name" UNIQUE("catalog_id","name")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."variant_options" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_bom_bu_code" ON "vritti_core"."bom" ("business_unit_id","code");--> statement-breakpoint
CREATE INDEX "idx_bom_bu" ON "vritti_core"."bom" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_bom_lines_bom" ON "vritti_core"."bom_lines" ("bom_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_channels_catalog" ON "vritti_core"."catalog_channels" ("catalog_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_channels_channel" ON "vritti_core"."catalog_channels" ("channel_id");--> statement-breakpoint
CREATE INDEX "idx_catalogs_bu" ON "vritti_core"."catalogs" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_categories_bu" ON "vritti_core"."categories" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_categories_parent" ON "vritti_core"."categories" ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_categories_path" ON "vritti_core"."categories" USING gist ("path");--> statement-breakpoint
CREATE INDEX "idx_conversion_inputs_conversion" ON "vritti_core"."conversion_inputs" ("conversion_id");--> statement-breakpoint
CREATE INDEX "idx_conversion_inputs_item" ON "vritti_core"."conversion_inputs" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_conversion_outputs_conversion" ON "vritti_core"."conversion_outputs" ("conversion_id");--> statement-breakpoint
CREATE INDEX "idx_conversion_outputs_item" ON "vritti_core"."conversion_outputs" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_conversions_bu" ON "vritti_core"."conversions" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_conversions_bom" ON "vritti_core"."conversions" ("bom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_cost_categories_org_kind_item" ON "vritti_core"."cost_categories" ("organization_id") WHERE "kind" = 'ITEM';--> statement-breakpoint
CREATE INDEX "idx_cost_categories_org" ON "vritti_core"."cost_categories" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_cost_categories_kind" ON "vritti_core"."cost_categories" ("kind");--> statement-breakpoint
CREATE INDEX "idx_credit_note_applications_cn" ON "vritti_core"."credit_note_applications" ("credit_note_id");--> statement-breakpoint
CREATE INDEX "idx_credit_note_applications_invoice" ON "vritti_core"."credit_note_applications" ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_credit_notes_bu" ON "vritti_core"."credit_notes" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_customers_bu" ON "vritti_core"."customers" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_customers_phone" ON "vritti_core"."customers" ("phone");--> statement-breakpoint
CREATE INDEX "idx_customers_email" ON "vritti_core"."customers" ("email");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_items_receipt" ON "vritti_core"."goods_receipt_items" ("goods_receipt_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_items_inventory" ON "vritti_core"."goods_receipt_items" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_items_uom" ON "vritti_core"."goods_receipt_items" ("uom_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_line_items_line" ON "vritti_core"."goods_receipt_line_items" ("goods_receipt_line_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_lines_item" ON "vritti_core"."goods_receipt_lines" ("goods_receipt_item_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_lines_lot" ON "vritti_core"."goods_receipt_lines" ("goods_receipt_lot_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_lines_location" ON "vritti_core"."goods_receipt_lines" ("location_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_lines_resolved" ON "vritti_core"."goods_receipt_lines" ("resolved_quant_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_lots_item" ON "vritti_core"."goods_receipt_lots" ("goods_receipt_item_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_lots_resolved" ON "vritti_core"."goods_receipt_lots" ("resolved_lot_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipts_supplier" ON "vritti_core"."goods_receipts" ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipts_po" ON "vritti_core"."goods_receipts" ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipts_bu" ON "vritti_core"."goods_receipts" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_costs_source" ON "vritti_core"."inventory_item_costs" ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_costs_category" ON "vritti_core"."inventory_item_costs" ("category_id","source_type","source_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_costs_created_at" ON "vritti_core"."inventory_item_costs" ("created_at");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_ledger_item" ON "vritti_core"."inventory_item_ledger" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_ledger_bu" ON "vritti_core"."inventory_item_ledger" ("business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_ledger_ref" ON "vritti_core"."inventory_item_ledger" ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_ledger_created" ON "vritti_core"."inventory_item_ledger" ("inventory_item_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_locations_item" ON "vritti_core"."inventory_item_locations" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_locations_location" ON "vritti_core"."inventory_item_locations" ("location_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_lots_item" ON "vritti_core"."inventory_item_lots" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_lots_expiry" ON "vritti_core"."inventory_item_lots" ("expiry_date");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_quant_costs_cost" ON "vritti_core"."inventory_item_quant_costs" ("cost_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_quants_item" ON "vritti_core"."inventory_item_quants" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_quants_location" ON "vritti_core"."inventory_item_quants" ("location_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_quants_item_location" ON "vritti_core"."inventory_item_quants" ("inventory_item_id","location_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_quants_item_location_lot" ON "vritti_core"."inventory_item_quants" ("inventory_item_id","location_id","lot_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_quants_lot" ON "vritti_core"."inventory_item_quants" ("lot_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_quants_supplier" ON "vritti_core"."inventory_item_quants" ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_quants_source" ON "vritti_core"."inventory_item_quants" ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_quants_active" ON "vritti_core"."inventory_item_quants" ("inventory_item_id","location_id") WHERE "quantity" > 0;--> statement-breakpoint
CREATE INDEX "idx_inventory_item_serials_quant" ON "vritti_core"."inventory_item_serials" ("inventory_item_quant_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_serials_item" ON "vritti_core"."inventory_item_serials" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_serials_quant_status" ON "vritti_core"."inventory_item_serials" ("inventory_item_quant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_iiuc_item_uom" ON "vritti_core"."inventory_item_uom_conversions" ("inventory_item_id","uom_id");--> statement-breakpoint
CREATE INDEX "idx_iiuc_bu" ON "vritti_core"."inventory_item_uom_conversions" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_iiuc_item" ON "vritti_core"."inventory_item_uom_conversions" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_items_bu" ON "vritti_core"."inventory_items" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_items_category" ON "vritti_core"."inventory_items" ("category_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_items_invoice" ON "vritti_core"."invoice_items" ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_bu" ON "vritti_core"."invoices" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_party" ON "vritti_core"."invoices" ("party_type","party_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_item_field_value" ON "vritti_core"."item_field_values" ("item_id","field_definition_id");--> statement-breakpoint
CREATE INDEX "idx_locations_bu" ON "vritti_core"."locations" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_locations_parent" ON "vritti_core"."locations" ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_modifier_groups_bu" ON "vritti_core"."modifier_groups" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_modifier_groups_catalog" ON "vritti_core"."modifier_groups" ("catalog_id");--> statement-breakpoint
CREATE INDEX "idx_modifier_options_group" ON "vritti_core"."modifier_options" ("group_id");--> statement-breakpoint
CREATE INDEX "idx_offering_options_offering" ON "vritti_core"."offering_options" ("offering_id");--> statement-breakpoint
CREATE INDEX "idx_offering_variant_components_item" ON "vritti_core"."offering_variant_components" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_offering_variant_option_values_value" ON "vritti_core"."offering_variant_option_values" ("variant_option_value_id");--> statement-breakpoint
CREATE INDEX "idx_offering_variants_offering" ON "vritti_core"."offering_variants" ("offering_id");--> statement-breakpoint
CREATE INDEX "idx_offerings_bu" ON "vritti_core"."offerings" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_offerings_catalog" ON "vritti_core"."offerings" ("catalog_id");--> statement-breakpoint
CREATE INDEX "idx_offerings_category" ON "vritti_core"."offerings" ("category_id");--> statement-breakpoint
CREATE INDEX "idx_order_item_modifiers_item" ON "vritti_core"."order_item_modifiers" ("order_item_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_order" ON "vritti_core"."order_items" ("order_id");--> statement-breakpoint
CREATE INDEX "idx_orders_bu" ON "vritti_core"."orders" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "vritti_core"."orders" ("status");--> statement-breakpoint
CREATE INDEX "idx_payments_invoice" ON "vritti_core"."payments" ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_pos_terminals_bu" ON "vritti_core"."pos_terminals" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_pos_terminals_location" ON "vritti_core"."pos_terminals" ("location_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_order_items_po" ON "vritti_core"."purchase_order_items" ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_bu" ON "vritti_core"."purchase_orders" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_supplier" ON "vritti_core"."purchase_orders" ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_sales_channels_org" ON "vritti_core"."sales_channels" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_sales_channels_kind" ON "vritti_core"."sales_channels" ("kind");--> statement-breakpoint
CREATE INDEX "idx_sa_line_items_line" ON "vritti_core"."stock_adjustment_line_items" ("stock_adjustment_line_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustment_lines_adjustment" ON "vritti_core"."stock_adjustment_lines" ("stock_adjustment_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustment_lines_lot" ON "vritti_core"."stock_adjustment_lines" ("stock_adjustment_lot_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustment_lines_quant" ON "vritti_core"."stock_adjustment_lines" ("quant_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustment_lines_resolved" ON "vritti_core"."stock_adjustment_lines" ("resolved_quant_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustment_lines_uom" ON "vritti_core"."stock_adjustment_lines" ("uom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_stock_adjustment_lines_lot_location_uom" ON "vritti_core"."stock_adjustment_lines" ("stock_adjustment_id","stock_adjustment_lot_id","location_id","uom_id") WHERE "quant_id" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_stock_adjustment_lots_adj" ON "vritti_core"."stock_adjustment_lots" ("stock_adjustment_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustment_lots_resolved" ON "vritti_core"."stock_adjustment_lots" ("resolved_lot_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustments_bu" ON "vritti_core"."stock_adjustments" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustments_item" ON "vritti_core"."stock_adjustments" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustments_status" ON "vritti_core"."stock_adjustments" ("status");--> statement-breakpoint
CREATE INDEX "idx_stock_transfers_item" ON "vritti_core"."stock_transfers" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_stock_transfers_from_bu" ON "vritti_core"."stock_transfers" ("from_bu_id");--> statement-breakpoint
CREATE INDEX "idx_stock_transfers_to_bu" ON "vritti_core"."stock_transfers" ("to_bu_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_contacts_supplier" ON "vritti_core"."supplier_contacts" ("supplier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_contacts_primary" ON "vritti_core"."supplier_contacts" ("supplier_id") WHERE is_primary = true;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_contacts_supplier_email" ON "vritti_core"."supplier_contacts" ("supplier_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_items_supplier_item_uom" ON "vritti_core"."supplier_items" ("supplier_id","inventory_item_id","uom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_items_preferred" ON "vritti_core"."supplier_items" ("inventory_item_id") WHERE is_preferred = true;--> statement-breakpoint
CREATE INDEX "idx_supplier_items_supplier" ON "vritti_core"."supplier_items" ("supplier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_suppliers_bu_code" ON "vritti_core"."suppliers" ("business_unit_id","code");--> statement-breakpoint
CREATE INDEX "idx_suppliers_bu" ON "vritti_core"."suppliers" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tax_groups_bu_name_unique" ON "vritti_core"."tax_groups" ("business_unit_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_uom_bu_symbol" ON "vritti_core"."uom" ("business_unit_id","symbol");--> statement-breakpoint
CREATE INDEX "idx_uom_bu" ON "vritti_core"."uom" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_uom_dimension" ON "vritti_core"."uom" ("dimension_id");--> statement-breakpoint
CREATE INDEX "idx_uom_dimensions_bu" ON "vritti_core"."uom_dimensions" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_variant_option_values_option" ON "vritti_core"."variant_option_values" ("variant_option_id");--> statement-breakpoint
CREATE INDEX "idx_variant_options_catalog" ON "vritti_core"."variant_options" ("catalog_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."bom_lines" ADD CONSTRAINT "bom_lines_bom_id_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "vritti_core"."bom"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."bom_lines" ADD CONSTRAINT "bom_lines_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."catalog_channels" ADD CONSTRAINT "catalog_channels_catalog_id_catalogs_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "vritti_core"."catalogs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."catalog_channels" ADD CONSTRAINT "catalog_channels_channel_id_sales_channels_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "vritti_core"."sales_channels"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."conversion_inputs" ADD CONSTRAINT "conversion_inputs_conversion_id_conversions_id_fkey" FOREIGN KEY ("conversion_id") REFERENCES "vritti_core"."conversions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."conversion_inputs" ADD CONSTRAINT "conversion_inputs_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."conversion_outputs" ADD CONSTRAINT "conversion_outputs_conversion_id_conversions_id_fkey" FOREIGN KEY ("conversion_id") REFERENCES "vritti_core"."conversions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."conversion_outputs" ADD CONSTRAINT "conversion_outputs_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."conversions" ADD CONSTRAINT "conversions_bom_id_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "vritti_core"."bom"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."credit_note_applications" ADD CONSTRAINT "credit_note_applications_credit_note_id_credit_notes_id_fkey" FOREIGN KEY ("credit_note_id") REFERENCES "vritti_core"."credit_notes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."credit_note_applications" ADD CONSTRAINT "credit_note_applications_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "vritti_core"."invoices"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_goods_receipt_id_goods_receipts_id_fkey" FOREIGN KEY ("goods_receipt_id") REFERENCES "vritti_core"."goods_receipts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "vritti_core"."uom"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_line_items" ADD CONSTRAINT "goods_receipt_line_items_xPce4mspmdCq_fkey" FOREIGN KEY ("goods_receipt_line_id") REFERENCES "vritti_core"."goods_receipt_lines"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_LCQNKaQNEtiW_fkey" FOREIGN KEY ("goods_receipt_item_id") REFERENCES "vritti_core"."goods_receipt_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_V70jEkCkMhay_fkey" FOREIGN KEY ("goods_receipt_lot_id") REFERENCES "vritti_core"."goods_receipt_lots"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "vritti_core"."locations"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_bDwzM4gXMdkg_fkey" FOREIGN KEY ("resolved_quant_id") REFERENCES "vritti_core"."inventory_item_quants"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_lots" ADD CONSTRAINT "goods_receipt_lots_CLiJ36meIGXj_fkey" FOREIGN KEY ("goods_receipt_item_id") REFERENCES "vritti_core"."goods_receipt_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_lots" ADD CONSTRAINT "goods_receipt_lots_resolved_lot_id_inventory_item_lots_id_fkey" FOREIGN KEY ("resolved_lot_id") REFERENCES "vritti_core"."inventory_item_lots"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipts" ADD CONSTRAINT "goods_receipts_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "vritti_core"."suppliers"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipts" ADD CONSTRAINT "goods_receipts_purchase_order_id_purchase_orders_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "vritti_core"."purchase_orders"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_costs" ADD CONSTRAINT "inventory_item_costs_category_id_cost_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "vritti_core"."cost_categories"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_ledger" ADD CONSTRAINT "inventory_item_ledger_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_locations" ADD CONSTRAINT "inventory_item_locations_a712NwWdDuJg_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_locations" ADD CONSTRAINT "inventory_item_locations_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "vritti_core"."locations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_lots" ADD CONSTRAINT "inventory_item_lots_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_quant_costs" ADD CONSTRAINT "inventory_item_quant_costs_c3KpiPKUQ4N1_fkey" FOREIGN KEY ("quant_id") REFERENCES "vritti_core"."inventory_item_quants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_quant_costs" ADD CONSTRAINT "inventory_item_quant_costs_cost_id_inventory_item_costs_id_fkey" FOREIGN KEY ("cost_id") REFERENCES "vritti_core"."inventory_item_costs"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_quants" ADD CONSTRAINT "inventory_item_quants_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_quants" ADD CONSTRAINT "inventory_item_quants_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "vritti_core"."locations"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_quants" ADD CONSTRAINT "inventory_item_quants_lot_id_inventory_item_lots_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "vritti_core"."inventory_item_lots"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_quants" ADD CONSTRAINT "inventory_item_quants_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "vritti_core"."suppliers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_serials" ADD CONSTRAINT "inventory_item_serials_s63VhASWzVvD_fkey" FOREIGN KEY ("inventory_item_quant_id") REFERENCES "vritti_core"."inventory_item_quants"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_serials" ADD CONSTRAINT "inventory_item_serials_OfOoSAD2LK8t_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" ADD CONSTRAINT "inventory_item_uom_conversions_rzKG09lM3ksH_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" ADD CONSTRAINT "inventory_item_uom_conversions_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "vritti_core"."uom"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" ADD CONSTRAINT "inventory_items_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "vritti_core"."categories"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" ADD CONSTRAINT "inventory_items_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "vritti_core"."uom"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" ADD CONSTRAINT "inventory_items_purchase_tax_group_id_tax_groups_id_fkey" FOREIGN KEY ("purchase_tax_group_id") REFERENCES "vritti_core"."tax_groups"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "vritti_core"."invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."item_field_values" ADD CONSTRAINT "item_field_values_item_id_offerings_id_fkey" FOREIGN KEY ("item_id") REFERENCES "vritti_core"."offerings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."item_field_values" ADD CONSTRAINT "item_field_values_V0gaE4dkunFk_fkey" FOREIGN KEY ("field_definition_id") REFERENCES "vritti_core"."item_field_definitions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."modifier_groups" ADD CONSTRAINT "modifier_groups_catalog_id_catalogs_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "vritti_core"."catalogs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_options" ADD CONSTRAINT "offering_options_offering_id_offerings_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "vritti_core"."offerings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_options" ADD CONSTRAINT "offering_options_variant_option_id_variant_options_id_fkey" FOREIGN KEY ("variant_option_id") REFERENCES "vritti_core"."variant_options"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_variant_components" ADD CONSTRAINT "offering_variant_components_jN35xDMsfNj6_fkey" FOREIGN KEY ("offering_variant_id") REFERENCES "vritti_core"."offering_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_variant_components" ADD CONSTRAINT "offering_variant_components_B1iN9sSqzSRm_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_variant_option_values" ADD CONSTRAINT "offering_variant_option_values_KYe3VBYNJOni_fkey" FOREIGN KEY ("variant_option_value_id") REFERENCES "vritti_core"."variant_option_values"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vritti_core"."offerings" ADD CONSTRAINT "offerings_catalog_id_catalogs_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "vritti_core"."catalogs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_order_item_id_order_items_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "vritti_core"."order_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "vritti_core"."orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."order_items" ADD CONSTRAINT "order_items_offering_id_offerings_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "vritti_core"."offerings"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."order_items" ADD CONSTRAINT "order_items_offering_variant_id_offering_variants_id_fkey" FOREIGN KEY ("offering_variant_id") REFERENCES "vritti_core"."offering_variants"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."orders" ADD CONSTRAINT "orders_channel_id_sales_channels_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "vritti_core"."sales_channels"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."orders" ADD CONSTRAINT "orders_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "vritti_core"."customers"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "vritti_core"."invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."pos_terminals" ADD CONSTRAINT "pos_terminals_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "vritti_core"."locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vritti_core"."pos_terminals" ADD CONSTRAINT "pos_terminals_catalog_id_catalogs_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "vritti_core"."catalogs"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "vritti_core"."purchase_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "vritti_core"."uom"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "vritti_core"."suppliers"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_line_items" ADD CONSTRAINT "stock_adjustment_line_items_BAKtyY4jjSIv_fkey" FOREIGN KEY ("stock_adjustment_line_id") REFERENCES "vritti_core"."stock_adjustment_lines"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lines" ADD CONSTRAINT "stock_adjustment_lines_V8pV4VOOh3IT_fkey" FOREIGN KEY ("stock_adjustment_id") REFERENCES "vritti_core"."stock_adjustments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lines" ADD CONSTRAINT "stock_adjustment_lines_DEs4DyxRxJef_fkey" FOREIGN KEY ("stock_adjustment_lot_id") REFERENCES "vritti_core"."stock_adjustment_lots"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lines" ADD CONSTRAINT "stock_adjustment_lines_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "vritti_core"."locations"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lines" ADD CONSTRAINT "stock_adjustment_lines_quant_id_inventory_item_quants_id_fkey" FOREIGN KEY ("quant_id") REFERENCES "vritti_core"."inventory_item_quants"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lines" ADD CONSTRAINT "stock_adjustment_lines_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "vritti_core"."uom"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lines" ADD CONSTRAINT "stock_adjustment_lines_0KyHHNwJ6NwT_fkey" FOREIGN KEY ("resolved_quant_id") REFERENCES "vritti_core"."inventory_item_quants"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lots" ADD CONSTRAINT "stock_adjustment_lots_QCXPZmh9zfIK_fkey" FOREIGN KEY ("stock_adjustment_id") REFERENCES "vritti_core"."stock_adjustments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lots" ADD CONSTRAINT "stock_adjustment_lots_2xbHGAUPqlLg_fkey" FOREIGN KEY ("resolved_lot_id") REFERENCES "vritti_core"."inventory_item_lots"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustments" ADD CONSTRAINT "stock_adjustments_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_transfers" ADD CONSTRAINT "stock_transfers_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_contacts" ADD CONSTRAINT "supplier_contacts_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "vritti_core"."suppliers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_items" ADD CONSTRAINT "supplier_items_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_items" ADD CONSTRAINT "supplier_items_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "vritti_core"."uom"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_items" ADD CONSTRAINT "fk_supplier_items_supplier_currency" FOREIGN KEY ("supplier_id","currency_code") REFERENCES "vritti_core"."suppliers"("id","currency_code") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_rates" ADD CONSTRAINT "tax_rates_tax_group_id_tax_groups_id_fkey" FOREIGN KEY ("tax_group_id") REFERENCES "vritti_core"."tax_groups"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."uom" ADD CONSTRAINT "uom_dimension_id_uom_dimensions_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "vritti_core"."uom_dimensions"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "vritti_core"."variant_option_values" ADD CONSTRAINT "variant_option_values_variant_option_id_variant_options_id_fkey" FOREIGN KEY ("variant_option_id") REFERENCES "vritti_core"."variant_options"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."variant_options" ADD CONSTRAINT "variant_options_catalog_id_catalogs_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "vritti_core"."catalogs"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE VIEW "vritti_core"."inventory_stock_levels" AS (select COALESCE("q"."inventory_item_id", "vritti_core"."inventory_item_locations"."inventory_item_id") as "inventory_item_id", COALESCE("q"."location_id", "vritti_core"."inventory_item_locations"."location_id") as "location_id", CAST(COALESCE("q"."stocked", 0) AS TEXT) as "stocked_quantity", CAST(COALESCE("q"."reserved", 0) AS TEXT) as "reserved_quantity", CAST(COALESCE("q"."available", 0) AS TEXT) as "available_quantity", "vritti_core"."inventory_item_locations"."reorder_level" from (select "inventory_item_id", "location_id", SUM("quantity") as "stocked", SUM("reserved_quantity") as "reserved", SUM("quantity" - "reserved_quantity") as "available" from "vritti_core"."inventory_item_quants" group by "vritti_core"."inventory_item_quants"."inventory_item_id", "vritti_core"."inventory_item_quants"."location_id") "q" full join "vritti_core"."inventory_item_locations" on "q"."inventory_item_id" = "vritti_core"."inventory_item_locations"."inventory_item_id" AND "q"."location_id" = "vritti_core"."inventory_item_locations"."location_id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."bom" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."bom" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."bom" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."bom" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."bom" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."catalog_channels" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."catalog_channels" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."catalog_channels" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."catalog_channels" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."catalog_channels" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."catalogs" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."catalogs" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."catalogs" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."catalogs" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."catalogs" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."categories" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."categories" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."categories" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."categories" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."categories" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."conversions" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."conversions" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."conversions" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."conversions" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."conversions" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."cost_categories" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."credit_notes" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."credit_notes" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."credit_notes" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."credit_notes" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."credit_notes" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."customers" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."customers" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."customers" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."customers" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."customers" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."document_counters" AS PERMISSIVE FOR ALL TO public USING ("vritti_core"."document_counters"."organization_id" = (select current_setting('app.org_id', true)::uuid)) WITH CHECK ("vritti_core"."document_counters"."organization_id" = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."goods_receipt_items" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."goods_receipt_items" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."goods_receipt_items" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."goods_receipt_items" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."goods_receipt_items" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."goods_receipt_line_items" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."goods_receipt_line_items" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."goods_receipt_line_items" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."goods_receipt_line_items" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."goods_receipt_line_items" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."goods_receipt_lines" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."goods_receipt_lines" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."goods_receipt_lines" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."goods_receipt_lines" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."goods_receipt_lines" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."goods_receipt_lots" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."goods_receipt_lots" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."goods_receipt_lots" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."goods_receipt_lots" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."goods_receipt_lots" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."goods_receipts" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."goods_receipts" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."goods_receipts" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."goods_receipts" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."goods_receipts" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."inventory_item_costs" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."inventory_item_locations" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."inventory_item_locations" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."inventory_item_locations" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."inventory_item_locations" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."inventory_item_locations" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."inventory_item_lots" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."inventory_item_lots" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."inventory_item_lots" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."inventory_item_lots" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."inventory_item_lots" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."inventory_item_quant_costs" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."inventory_item_quants" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."inventory_item_quants" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."inventory_item_quants" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."inventory_item_quants" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."inventory_item_quants" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."inventory_item_serials" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."inventory_item_serials" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."inventory_item_serials" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."inventory_item_serials" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."inventory_item_serials" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."inventory_item_uom_conversions" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."inventory_item_uom_conversions" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."inventory_item_uom_conversions" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."inventory_item_uom_conversions" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."inventory_item_uom_conversions" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."inventory_items" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."inventory_items" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."inventory_items" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."inventory_items" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."inventory_items" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."invoices" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."invoices" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."invoices" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."invoices" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."invoices" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."item_field_definitions" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."item_field_definitions" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."item_field_definitions" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."item_field_definitions" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."item_field_definitions" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."locations" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."locations" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."locations" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."locations" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."locations" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."modifier_groups" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."modifier_groups" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."modifier_groups" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."modifier_groups" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."modifier_groups" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."offering_variant_components" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."offerings" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."offerings" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."offerings" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."offerings" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."offerings" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."orders" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."orders" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."orders" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."orders" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."orders" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."pos_terminals" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."pos_terminals" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."pos_terminals" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."pos_terminals" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."pos_terminals" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."purchase_orders" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."purchase_orders" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."purchase_orders" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."purchase_orders" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."purchase_orders" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."sales_channels" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."stock_adjustment_line_items" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."stock_adjustment_line_items" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."stock_adjustment_line_items" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."stock_adjustment_line_items" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."stock_adjustment_line_items" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."stock_adjustment_lines" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."stock_adjustment_lines" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."stock_adjustment_lines" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."stock_adjustment_lines" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."stock_adjustment_lines" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."stock_adjustment_lots" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."stock_adjustment_lots" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."stock_adjustment_lots" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."stock_adjustment_lots" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."stock_adjustment_lots" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."stock_adjustments" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."stock_adjustments" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."stock_adjustments" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."stock_adjustments" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."stock_adjustments" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."stock_transfers" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."supplier_contacts" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."supplier_contacts" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."supplier_contacts" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."supplier_contacts" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."supplier_contacts" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."suppliers" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."suppliers" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."suppliers" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."suppliers" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."suppliers" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."tax_groups" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."tax_groups" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."tax_groups" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."tax_groups" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."tax_groups" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."uom" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."uom" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."uom" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."uom" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."uom" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."uom_dimensions" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."uom_dimensions" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."uom_dimensions" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."uom_dimensions" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."uom_dimensions" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."variant_option_values" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."variant_options" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));