CREATE SCHEMA "commerce";
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS ltree SCHEMA "commerce";
--> statement-breakpoint
CREATE OR REPLACE FUNCTION commerce.format_ltree_path(path commerce.ltree)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT string_agg(initcap(replace(label, '_', ' ')), ' › ' ORDER BY ord)
  FROM unnest(string_to_array(path::text, '.')) WITH ORDINALITY AS segments(label, ord);
$$;
--> statement-breakpoint
CREATE TYPE "commerce"."category_role" AS ENUM('GROUP', 'CATEGORY');--> statement-breakpoint
CREATE TYPE "commerce"."conversion_status" AS ENUM('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "commerce"."cost_category_kind" AS ENUM('ITEM', 'FREIGHT', 'DUTY', 'INSURANCE', 'SERVICE', 'OTHER');--> statement-breakpoint
CREATE TYPE "commerce"."cost_distribution_method" AS ENUM('by_value', 'by_quantity', 'equal');--> statement-breakpoint
CREATE TYPE "commerce"."cost_source_type" AS ENUM('goods_receipt', 'stock_adjustment', 'stock_transfer', 'manual_adjustment');--> statement-breakpoint
CREATE TYPE "commerce"."credit_note_status" AS ENUM('DRAFT', 'ISSUED', 'PARTIALLY_APPLIED', 'FULLY_APPLIED');--> statement-breakpoint
CREATE TYPE "commerce"."credit_note_type" AS ENUM('PAYABLE', 'RECEIVABLE');--> statement-breakpoint
CREATE TYPE "commerce"."exchange_rate_type" AS ENUM('FIXED', 'VARIABLE');--> statement-breakpoint
CREATE TYPE "commerce"."field_type" AS ENUM('text', 'number', 'boolean', 'select');--> statement-breakpoint
CREATE TYPE "commerce"."fulfilment_type" AS ENUM('STOCK', 'SERVICE', 'COMPOSITE');--> statement-breakpoint
CREATE TYPE "commerce"."goods_receipt_status" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "commerce"."govt_id_type" AS ENUM('PAN', 'AADHAAR', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'CIVIL_ID', 'NATIONAL_ID');--> statement-breakpoint
CREATE TYPE "commerce"."inventory_item_ledger_reference_type" AS ENUM('GOODS_RECEIPT', 'STOCK_ADJUSTMENT', 'CONVERSION', 'STOCK_TRANSFER', 'ORDER');--> statement-breakpoint
CREATE TYPE "commerce"."inventory_item_ledger_type" AS ENUM('GOODS_RECEIPT', 'ORDER_RESERVE', 'ORDER_DEDUCT', 'ORDER_CANCEL', 'ADJUSTMENT', 'CONVERSION_INPUT', 'CONVERSION_OUTPUT', 'TRANSFER_OUT', 'TRANSFER_IN', 'OPENING_STOCK');--> statement-breakpoint
CREATE TYPE "commerce"."inventory_item_type" AS ENUM('RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE');--> statement-breakpoint
CREATE TYPE "commerce"."inventory_pick_strategy" AS ENUM('none', 'fifo', 'fefo');--> statement-breakpoint
CREATE TYPE "commerce"."inventory_tracking" AS ENUM('quantity', 'lot', 'lot_serial', 'serial');--> statement-breakpoint
CREATE TYPE "commerce"."invoice_party_type" AS ENUM('SUPPLIER', 'CUSTOMER', 'AGGREGATOR');--> statement-breakpoint
CREATE TYPE "commerce"."invoice_status" AS ENUM('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID');--> statement-breakpoint
CREATE TYPE "commerce"."invoice_type" AS ENUM('PAYABLE', 'RECEIVABLE');--> statement-breakpoint
CREATE TYPE "commerce"."location_role" AS ENUM('STORAGE', 'RESERVED_STORAGE', 'ZONE');--> statement-breakpoint
CREATE TYPE "commerce"."messaging_app" AS ENUM('WHATSAPP', 'TELEGRAM', 'SIGNAL', 'IMO', 'VIBER', 'WECHAT');--> statement-breakpoint
CREATE TYPE "commerce"."modifier_selection_type" AS ENUM('SINGLE', 'MULTI');--> statement-breakpoint
CREATE TYPE "commerce"."order_item_status" AS ENUM('PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "commerce"."order_source" AS ENUM('ONLINE', 'WALK_IN');--> statement-breakpoint
CREATE TYPE "commerce"."order_status" AS ENUM('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "commerce"."order_type" AS ENUM('DINE_IN', 'TAKEAWAY', 'DELIVERY');--> statement-breakpoint
CREATE TYPE "commerce"."party_communication_channel" AS ENUM('EMAIL', 'PHONE');--> statement-breakpoint
CREATE TYPE "commerce"."party_function_type" AS ENUM('REGISTERED', 'BILLING', 'SHIPPING', 'ORDERING', 'ORDER', 'ACCOUNTS', 'LOGISTICS', 'ESCALATION');--> statement-breakpoint
CREATE TYPE "commerce"."party_identifier_type" AS ENUM('PAN', 'AADHAAR', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'CIVIL_ID', 'NATIONAL_ID', 'DUNS', 'LEI', 'CIN');--> statement-breakpoint
CREATE TYPE "commerce"."party_license_type" AS ENUM('DRUG', 'EXCISE', 'FSSAI', 'OTHER');--> statement-breakpoint
CREATE TYPE "commerce"."party_type" AS ENUM('PERSON', 'COMPANY');--> statement-breakpoint
CREATE TYPE "commerce"."payment_method" AS ENUM('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'WALLET', 'ONLINE');--> statement-breakpoint
CREATE TYPE "commerce"."payment_status" AS ENUM('COMPLETED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "commerce"."purchase_order_status" AS ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "commerce"."sales_channel_kind" AS ENUM('IN_STORE', 'ONLINE', 'ZOMATO', 'SWIGGY', 'OTHER');--> statement-breakpoint
CREATE TYPE "commerce"."quant_item_status" AS ENUM('AVAILABLE', 'RESERVED', 'CONSUMED');--> statement-breakpoint
CREATE TYPE "commerce"."social_platform" AS ENUM('INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'X', 'YOUTUBE', 'TIKTOK', 'WEBSITE');--> statement-breakpoint
CREATE TYPE "commerce"."stock_adjustment_status" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "commerce"."stock_adjustment_type" AS ENUM('WASTE', 'DAMAGE', 'THEFT', 'EXPIRED', 'CORRECTION', 'OPENING_STOCK');--> statement-breakpoint
CREATE TYPE "commerce"."stock_transfer_status" AS ENUM('REQUESTED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "commerce"."supplier_price_source" AS ENUM('QUOTATION', 'MANUAL', 'IMPORT');--> statement-breakpoint
CREATE TYPE "commerce"."tax_authority_level" AS ENUM('FEDERAL', 'STATE', 'COUNTY', 'CITY', 'SPECIAL');--> statement-breakpoint
CREATE TYPE "commerce"."tax_id_type" AS ENUM('GST', 'VAT', 'EIN', 'SALES_TAX', 'OTHER');--> statement-breakpoint
CREATE TYPE "commerce"."tax_jurisdiction_level" AS ENUM('COUNTRY', 'STATE', 'COUNTY', 'CITY', 'DISTRICT');--> statement-breakpoint
CREATE TYPE "commerce"."tax_registration_type" AS ENUM('GSTIN', 'VAT', 'TIN', 'PAN', 'OTHER');--> statement-breakpoint
CREATE SEQUENCE "commerce"."goods_receipt_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "commerce"."order_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "commerce"."purchase_order_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "commerce"."stock_adjustment_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "commerce"."catalog_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"catalog_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_catalog_channels_bu_channel" UNIQUE("site_id","channel_id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."catalog_channels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."catalogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"name" varchar(255) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"tax_inclusive" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commerce"."catalogs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"name" varchar(255) NOT NULL,
	"image" varchar(255),
	"parent_id" uuid,
	"category_role" "commerce"."category_role" DEFAULT 'CATEGORY'::"commerce"."category_role" NOT NULL,
	"path_label" varchar(255) NOT NULL,
	"path" commerce.ltree NOT NULL,
	"path_breadcrumb" text GENERATED ALWAYS AS (commerce.format_ltree_path(path)) STORED,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"default_tax_class_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_categories_parent_path_label" UNIQUE("parent_id","path_label")
);
--> statement-breakpoint
ALTER TABLE "commerce"."categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."cost_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"kind" "commerce"."cost_category_kind" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_cost_categories_org_code" UNIQUE("organization_id","code"),
	CONSTRAINT "cost_categories_code_chk" CHECK ("code" ~ '^[a-z][a-z0-9-]*$')
);
--> statement-breakpoint
ALTER TABLE "commerce"."cost_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."credit_note_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"credit_note_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce"."credit_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"type" "commerce"."credit_note_type" NOT NULL,
	"party_type" "commerce"."invoice_party_type" NOT NULL,
	"party_id" uuid,
	"party_name" varchar(255) NOT NULL,
	"credit_note_number" varchar(50) NOT NULL,
	"amount" bigint NOT NULL,
	"applied_amount" bigint DEFAULT 0 NOT NULL,
	"remaining" bigint NOT NULL,
	"reason" text,
	"status" "commerce"."credit_note_status" DEFAULT 'DRAFT'::"commerce"."credit_note_status" NOT NULL,
	"issued_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_credit_notes_bu_number" UNIQUE("site_id","credit_note_number")
);
--> statement-breakpoint
ALTER TABLE "commerce"."credit_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(32),
	"email" varchar(255),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commerce"."customers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."document_counters" (
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"counter_key" varchar(120) NOT NULL,
	"last_number" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commerce"."document_counters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."goods_receipt_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
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
ALTER TABLE "commerce"."goods_receipt_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."goods_receipt_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"goods_receipt_line_id" uuid NOT NULL,
	"serial_number" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_goods_receipt_line_items_line_serial" UNIQUE("goods_receipt_line_id","serial_number")
);
--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipt_line_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."goods_receipt_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
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
ALTER TABLE "commerce"."goods_receipt_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."goods_receipt_lots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"goods_receipt_item_id" uuid NOT NULL,
	"lot_number" varchar(100) NOT NULL,
	"manufacturing_date" timestamp with time zone,
	"expiry_date" timestamp with time zone NOT NULL,
	"resolved_lot_id" uuid,
	"mrp" bigint,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_goods_receipt_lots_item_lot" UNIQUE("goods_receipt_item_id","lot_number"),
	CONSTRAINT "ck_goods_receipt_lots_expiry_after_mfg" CHECK ("manufacturing_date" IS NULL OR "expiry_date" > "manufacturing_date")
);
--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipt_lots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."goods_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"supplier_id" uuid NOT NULL,
	"gr_number" varchar(50) NOT NULL,
	"status" "commerce"."goods_receipt_status" DEFAULT 'DRAFT'::"commerce"."goods_receipt_status" NOT NULL,
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
ALTER TABLE "commerce"."goods_receipts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."inventory_item_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"category_id" uuid NOT NULL,
	"total_amount" bigint NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"source_type" "commerce"."cost_source_type" NOT NULL,
	"source_id" uuid NOT NULL,
	"distribution_method" "commerce"."cost_distribution_method" DEFAULT 'by_value'::"commerce"."cost_distribution_method" NOT NULL,
	"unallocated_amount" bigint DEFAULT 0 NOT NULL,
	"vendor_ref" varchar(100),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_costs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."inventory_item_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"type" "commerce"."inventory_item_ledger_type" NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"reference_type" "commerce"."inventory_item_ledger_reference_type",
	"reference_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce"."inventory_item_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"is_preferred" boolean DEFAULT false NOT NULL,
	"min_level" numeric(12,3) DEFAULT '0' NOT NULL,
	"max_level" numeric(12,3) DEFAULT '0' NOT NULL,
	"safety_stock" numeric(12,3) DEFAULT '0' NOT NULL,
	"bin_capacity" numeric(12,3),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inventory_item_locations" UNIQUE("inventory_item_id","location_id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_locations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."inventory_item_lots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"lot_number" varchar(100) NOT NULL,
	"manufacturing_date" timestamp with time zone,
	"expiry_date" timestamp with time zone NOT NULL,
	"mrp" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inventory_item_lots_org_item_number" UNIQUE("organization_id","inventory_item_id","lot_number"),
	CONSTRAINT "ck_inventory_item_lots_expiry_after_mfg" CHECK ("manufacturing_date" IS NULL OR "expiry_date" > "manufacturing_date")
);
--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_lots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."inventory_item_mrps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"uom_id" uuid NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"amount" bigint NOT NULL,
	"source_lot_id" uuid,
	"sourced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inventory_item_mrps_item_uom_currency" UNIQUE("inventory_item_id","uom_id","currency_code")
);
--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_mrps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."inventory_item_quant_costs" (
	"quant_id" uuid,
	"cost_id" uuid,
	"allocated_amount" bigint NOT NULL,
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pk_inventory_item_quant_costs" PRIMARY KEY("quant_id","cost_id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_quant_costs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."inventory_item_quants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
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
	"source_type" "commerce"."cost_source_type",
	"source_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_inventory_item_quants_unit_cost_positive" CHECK ("unit_cost" > 0)
);
--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_quants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."inventory_item_serials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"inventory_item_quant_id" uuid,
	"inventory_item_id" uuid NOT NULL,
	"serial_number" varchar(100) NOT NULL,
	"status" "commerce"."quant_item_status" DEFAULT 'AVAILABLE'::"commerce"."quant_item_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inventory_item_serials_serial" UNIQUE("organization_id","inventory_item_id","serial_number")
);
--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_serials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."inventory_item_sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"is_stocked" boolean DEFAULT true NOT NULL,
	"reorder_point" numeric(12,3) DEFAULT '0' NOT NULL,
	"max_stock_level" numeric(12,3) DEFAULT '0' NOT NULL,
	"safety_stock" numeric(12,3) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inventory_item_sites" UNIQUE("inventory_item_id","site_id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_sites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."inventory_item_uom_conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
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
ALTER TABLE "commerce"."inventory_item_uom_conversions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(100) NOT NULL,
	"type" "commerce"."inventory_item_type" NOT NULL,
	"tracking" "commerce"."inventory_tracking" DEFAULT 'lot'::"commerce"."inventory_tracking" NOT NULL,
	"pick_strategy" "commerce"."inventory_pick_strategy" DEFAULT 'none'::"commerce"."inventory_pick_strategy" NOT NULL,
	"category_id" uuid NOT NULL,
	"tax_class_id" uuid NOT NULL,
	"description" varchar(500),
	"uom_id" uuid NOT NULL,
	"hsn_code" varchar(20),
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inventory_items_org_code" UNIQUE("organization_id","code"),
	CONSTRAINT "inventory_items_code_chk" CHECK ("code" ~ '^[a-z][a-z0-9-]*$')
);
--> statement-breakpoint
ALTER TABLE "commerce"."inventory_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" varchar(255) NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"unit_price" bigint NOT NULL,
	"tax_amount" bigint DEFAULT 0 NOT NULL,
	"total" bigint NOT NULL,
	"reference_item_id" uuid
);
--> statement-breakpoint
CREATE TABLE "commerce"."invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"type" "commerce"."invoice_type" NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"party_type" "commerce"."invoice_party_type" NOT NULL,
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
	"status" "commerce"."invoice_status" DEFAULT 'DRAFT'::"commerce"."invoice_status" NOT NULL,
	"payment_terms" varchar(50),
	"issued_date" timestamp with time zone,
	"due_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_invoices_bu_number" UNIQUE("site_id","invoice_number")
);
--> statement-breakpoint
ALTER TABLE "commerce"."invoices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."item_field_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"name" varchar(100) NOT NULL,
	"field_type" "commerce"."field_type" NOT NULL,
	"options" jsonb DEFAULT '[]' NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commerce"."item_field_definitions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."item_field_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"item_id" uuid NOT NULL,
	"field_definition_id" uuid NOT NULL,
	"value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce"."locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"parent_id" uuid,
	"path" commerce.ltree NOT NULL,
	"path_breadcrumb" text GENERATED ALWAYS AS (commerce.format_ltree_path(path)) STORED,
	"sort_order" integer DEFAULT 1 NOT NULL,
	"area" varchar(100),
	"manager_id" uuid,
	"location_role" "commerce"."location_role" DEFAULT 'STORAGE'::"commerce"."location_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_locations_bu_parent_code" UNIQUE("site_id","parent_id","code")
);
--> statement-breakpoint
ALTER TABLE "commerce"."locations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."modifier_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"catalog_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"selection_type" "commerce"."modifier_selection_type" NOT NULL,
	"min_selections" integer DEFAULT 0 NOT NULL,
	"max_selections" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_modifier_groups_catalog_name" UNIQUE("catalog_id","name")
);
--> statement-breakpoint
ALTER TABLE "commerce"."modifier_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."modifier_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
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
CREATE TABLE "commerce"."offering_modifier_groups" (
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"offering_id" uuid,
	"group_id" uuid,
	CONSTRAINT "offering_modifier_groups_pkey" PRIMARY KEY("offering_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "commerce"."offering_options" (
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"offering_id" uuid,
	"variant_option_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "offering_options_pkey" PRIMARY KEY("offering_id","variant_option_id")
);
--> statement-breakpoint
CREATE TABLE "commerce"."offering_variant_components" (
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"offering_variant_id" uuid,
	"inventory_item_id" uuid,
	"quantity" numeric(12,3) DEFAULT '1' NOT NULL,
	CONSTRAINT "offering_variant_components_pkey" PRIMARY KEY("offering_variant_id","inventory_item_id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."offering_variant_components" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."offering_variant_option_values" (
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"offering_variant_id" uuid,
	"variant_option_value_id" uuid,
	CONSTRAINT "offering_variant_option_values_pkey" PRIMARY KEY("offering_variant_id","variant_option_value_id")
);
--> statement-breakpoint
CREATE TABLE "commerce"."offering_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"offering_id" uuid NOT NULL,
	"sku" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"price" bigint NOT NULL,
	"tax_class_id" uuid,
	"is_available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"attributes" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_offering_variants_offering_sku" UNIQUE("offering_id","sku")
);
--> statement-breakpoint
CREATE TABLE "commerce"."offerings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"catalog_id" uuid NOT NULL,
	"category_id" uuid,
	"fulfilment_type" "commerce"."fulfilment_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"sales_tax_group_id" uuid NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"attributes" jsonb DEFAULT '{}' NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commerce"."offerings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."order_item_modifiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"order_item_id" uuid NOT NULL,
	"modifier_group_id" uuid NOT NULL,
	"modifier_option_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"additional_price" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce"."order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
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
CREATE TABLE "commerce"."orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"type" "commerce"."order_type" NOT NULL,
	"channel" "commerce"."order_source" NOT NULL,
	"channel_id" uuid,
	"status" "commerce"."order_status" DEFAULT 'PENDING'::"commerce"."order_status" NOT NULL,
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
ALTER TABLE "commerce"."orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"party_type" "commerce"."party_type" NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"legal_name" varchar(255),
	"jurisdiction_id" uuid,
	"first_name" varchar(120),
	"last_name" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commerce"."parties" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."party_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"party_id" uuid NOT NULL,
	"line1" varchar(255) NOT NULL,
	"line2" varchar(255),
	"city" varchar(120),
	"region" varchar(120),
	"postal_code" varchar(20),
	"country_code" varchar(2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_party_addresses_party_id" UNIQUE("party_id","id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."party_addresses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."party_bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"party_id" uuid NOT NULL,
	"account_name" varchar(255) NOT NULL,
	"account_number" varchar(50) NOT NULL,
	"ifsc_code" varchar(20),
	"upi_id" varchar(100),
	"bank_name" varchar(255),
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_party_bank_accounts_party_number" UNIQUE("party_id","account_number")
);
--> statement-breakpoint
ALTER TABLE "commerce"."party_bank_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."party_communication_apps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"communication_id" uuid NOT NULL,
	"app" "commerce"."messaging_app" NOT NULL,
	"handle" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_party_communication_apps_comm_app" UNIQUE("communication_id","app")
);
--> statement-breakpoint
ALTER TABLE "commerce"."party_communication_apps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."party_communications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"party_id" uuid NOT NULL,
	"channel" "commerce"."party_communication_channel" NOT NULL,
	"value" varchar(255) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_party_communications_party_channel_value" UNIQUE("party_id","channel","value")
);
--> statement-breakpoint
ALTER TABLE "commerce"."party_communications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."party_functions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"party_id" uuid NOT NULL,
	"function" "commerce"."party_function_type" NOT NULL,
	"party_address_id" uuid,
	"party_relationship_id" uuid,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_party_functions_relationship_function" UNIQUE("party_relationship_id","function"),
	CONSTRAINT "uq_party_functions_address_function" UNIQUE("party_address_id","function"),
	CONSTRAINT "party_functions_target_chk" CHECK (("function" IN ('REGISTERED','BILLING','SHIPPING','ORDERING') AND party_address_id IS NOT NULL AND party_relationship_id IS NULL) OR ("function" IN ('ORDER','ACCOUNTS','LOGISTICS','ESCALATION') AND party_relationship_id IS NOT NULL AND party_address_id IS NULL))
);
--> statement-breakpoint
ALTER TABLE "commerce"."party_functions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."party_identifiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"party_id" uuid NOT NULL,
	"id_type" "commerce"."party_identifier_type" NOT NULL,
	"id_value" varchar(100) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_party_identifiers_org_type_value" UNIQUE("organization_id","id_type","id_value")
);
--> statement-breakpoint
ALTER TABLE "commerce"."party_identifiers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."party_licenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"party_id" uuid NOT NULL,
	"license_type" "commerce"."party_license_type" NOT NULL,
	"license_number" varchar(100) NOT NULL,
	"region" varchar(120),
	"valid_to" date,
	"notes" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_party_licenses_org_type_number" UNIQUE("organization_id","license_type","license_number")
);
--> statement-breakpoint
ALTER TABLE "commerce"."party_licenses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."party_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"parent_party_id" uuid NOT NULL,
	"child_party_id" uuid NOT NULL,
	"job_title" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_party_rel_parent_child" UNIQUE("parent_party_id","child_party_id"),
	CONSTRAINT "uq_party_rel_parent_id" UNIQUE("parent_party_id","id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."party_relationships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."party_social_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"party_id" uuid NOT NULL,
	"platform" "commerce"."social_platform" NOT NULL,
	"url" varchar(500) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commerce"."party_social_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."party_tax_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"party_id" uuid NOT NULL,
	"jurisdiction_id" uuid NOT NULL,
	"registration_number" varchar(50) NOT NULL,
	"registration_type" "commerce"."tax_registration_type" NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_party_tax_reg_party_juris" UNIQUE("party_id","jurisdiction_id"),
	CONSTRAINT "uq_party_tax_reg_org_number" UNIQUE("organization_id","registration_number")
);
--> statement-breakpoint
ALTER TABLE "commerce"."party_tax_registrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"method" "commerce"."payment_method" NOT NULL,
	"reference" varchar(255),
	"status" "commerce"."payment_status" DEFAULT 'COMPLETED'::"commerce"."payment_status" NOT NULL,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce"."pos_terminals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"location_id" uuid NOT NULL,
	"catalog_id" uuid,
	"description" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_pos_terminals_bu_code" UNIQUE("site_id","code")
);
--> statement-breakpoint
ALTER TABLE "commerce"."pos_terminals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."purchase_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
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
CREATE TABLE "commerce"."purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"supplier_id" uuid NOT NULL,
	"po_number" varchar(50) NOT NULL,
	"status" "commerce"."purchase_order_status" DEFAULT 'DRAFT'::"commerce"."purchase_order_status" NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"exchange_rate" numeric(18,6) DEFAULT '1',
	"exchange_rate_type" "commerce"."exchange_rate_type" DEFAULT 'FIXED'::"commerce"."exchange_rate_type" NOT NULL,
	"order_date" date NOT NULL,
	"expected_by" timestamp with time zone,
	"timezone" varchar(50) DEFAULT cast(current_setting('app.site_timezone') as text) NOT NULL,
	"notes" text,
	"total_amount" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_purchase_orders_org_po_number" UNIQUE("organization_id","po_number")
);
--> statement-breakpoint
ALTER TABLE "commerce"."purchase_orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."sales_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"kind" "commerce"."sales_channel_kind" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_sales_channels_org_code" UNIQUE("organization_id","code")
);
--> statement-breakpoint
ALTER TABLE "commerce"."sales_channels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."stock_adjustment_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"stock_adjustment_line_id" uuid NOT NULL,
	"serial_number" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_stock_adjustment_line_items_line_serial" UNIQUE("stock_adjustment_line_id","serial_number")
);
--> statement-breakpoint
ALTER TABLE "commerce"."stock_adjustment_line_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."stock_adjustment_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
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
ALTER TABLE "commerce"."stock_adjustment_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."stock_adjustment_lots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"stock_adjustment_id" uuid NOT NULL,
	"lot_number" varchar(100) NOT NULL,
	"manufacturing_date" timestamp with time zone,
	"expiry_date" timestamp with time zone NOT NULL,
	"resolved_lot_id" uuid,
	"mrp" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_stock_adjustment_lots_adj_lot" UNIQUE("stock_adjustment_id","lot_number"),
	CONSTRAINT "ck_stock_adjustment_lots_expiry_after_mfg" CHECK ("manufacturing_date" IS NULL OR "expiry_date" > "manufacturing_date")
);
--> statement-breakpoint
ALTER TABLE "commerce"."stock_adjustment_lots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."stock_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"type" "commerce"."stock_adjustment_type" NOT NULL,
	"status" "commerce"."stock_adjustment_status" DEFAULT 'DRAFT'::"commerce"."stock_adjustment_status" NOT NULL,
	"reason" text,
	"unit_cost" bigint,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_stock_adjustments_org_code" UNIQUE("organization_id","code")
);
--> statement-breakpoint
ALTER TABLE "commerce"."stock_adjustments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."stock_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"from_site_id" uuid NOT NULL,
	"to_site_id" uuid NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"status" "commerce"."stock_transfer_status" DEFAULT 'REQUESTED'::"commerce"."stock_transfer_status" NOT NULL,
	"requested_by" uuid,
	"received_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commerce"."stock_transfers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."supplier_item_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"supplier_item_id" uuid NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id', true) as uuid),
	"unit_price" bigint NOT NULL,
	"scheme_buy_qty" numeric(12,3),
	"scheme_free_qty" numeric(12,3),
	"valid_from" date NOT NULL,
	"valid_to" date,
	"source" "commerce"."supplier_price_source" DEFAULT 'MANUAL'::"commerce"."supplier_price_source" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commerce"."supplier_item_prices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."supplier_item_sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"supplier_item_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"lead_time_days" integer,
	"min_order_quantity" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_supplier_item_sites" UNIQUE("supplier_item_id","site_id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."supplier_item_sites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."supplier_sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"legal_entity_id" uuid DEFAULT cast(current_setting('app.le_id') as uuid) NOT NULL,
	"supplier_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"party_tax_registration_id" uuid,
	"party_bank_account_id" uuid,
	"order_relationship_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_supplier_sites" UNIQUE("supplier_id","site_id")
);
--> statement-breakpoint
ALTER TABLE "commerce"."supplier_sites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."supplier_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"supplier_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"supplier_item_code" varchar(100),
	"currency_code" varchar(3) NOT NULL,
	"uom_id" uuid NOT NULL,
	"min_order_quantity" integer,
	"lead_time_days" integer,
	"scheme_buy_qty" numeric(12,3),
	"scheme_free_qty" numeric(12,3),
	"has_scheme" boolean DEFAULT false NOT NULL,
	"tax_inclusive" boolean DEFAULT false NOT NULL,
	"is_preferred" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce"."suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"legal_entity_id" uuid DEFAULT cast(current_setting('app.le_id') as uuid) NOT NULL,
	"party_id" uuid NOT NULL,
	"code" varchar(100) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"payment_terms" varchar(50),
	"lead_time_days" integer,
	"notes" varchar(500),
	"purchasing_blocked" boolean DEFAULT false NOT NULL,
	"payment_blocked" boolean DEFAULT false NOT NULL,
	"order_email" varchar(255),
	"order_phone" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_suppliers_id_currency" UNIQUE("id","currency_code")
);
--> statement-breakpoint
ALTER TABLE "commerce"."suppliers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."tax_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_tax_classes_org_code" UNIQUE("organization_id","code"),
	CONSTRAINT "tax_classes_code_chk" CHECK ("code" ~ '^[a-z][a-z0-9-]*$')
);
--> statement-breakpoint
ALTER TABLE "commerce"."tax_classes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."tax_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"authority_level" "commerce"."tax_authority_level" NOT NULL,
	"is_recoverable" boolean DEFAULT true NOT NULL,
	"is_withholding" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_tax_components_org_code" UNIQUE("organization_id","code"),
	CONSTRAINT "tax_components_code_chk" CHECK ("code" ~ '^[a-z][a-z0-9-]*$')
);
--> statement-breakpoint
ALTER TABLE "commerce"."tax_components" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."tax_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"legal_entity_id" uuid DEFAULT cast(current_setting('app.le_id') as uuid) NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commerce"."tax_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."tax_jurisdictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"level" "commerce"."tax_jurisdiction_level" NOT NULL,
	"parent_id" uuid,
	"country_code" varchar(2) NOT NULL,
	"region_code" varchar(10),
	"tax_union" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_tax_jurisdictions_org_code" UNIQUE("organization_id","code"),
	CONSTRAINT "tax_jurisdictions_code_chk" CHECK ("code" ~ '^[a-z][a-z0-9-]*$')
);
--> statement-breakpoint
ALTER TABLE "commerce"."tax_jurisdictions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."tax_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"tax_group_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"rate" numeric(5,2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commerce"."uom" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
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
ALTER TABLE "commerce"."uom" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."uom_dimensions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_uom_dimensions_org_code" UNIQUE("organization_id","code"),
	CONSTRAINT "uom_dimensions_code_chk" CHECK ("code" ~ '^[a-z][a-z0-9-]*$')
);
--> statement-breakpoint
ALTER TABLE "commerce"."uom_dimensions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."variant_option_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"variant_option_id" uuid NOT NULL,
	"value" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "uq_variant_option_values_option_value" UNIQUE("variant_option_id","value")
);
--> statement-breakpoint
ALTER TABLE "commerce"."variant_option_values" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."variant_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"catalog_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_variant_options_catalog_name" UNIQUE("catalog_id","name")
);
--> statement-breakpoint
ALTER TABLE "commerce"."variant_options" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_catalog_channels_catalog" ON "commerce"."catalog_channels" ("catalog_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_channels_channel" ON "commerce"."catalog_channels" ("channel_id");--> statement-breakpoint
CREATE INDEX "idx_catalogs_site" ON "commerce"."catalogs" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_categories_org" ON "commerce"."categories" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_categories_parent" ON "commerce"."categories" ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_categories_path" ON "commerce"."categories" USING gist ("path");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_cost_categories_org_kind_item" ON "commerce"."cost_categories" ("organization_id") WHERE "kind" = 'ITEM';--> statement-breakpoint
CREATE INDEX "idx_cost_categories_org" ON "commerce"."cost_categories" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_cost_categories_kind" ON "commerce"."cost_categories" ("kind");--> statement-breakpoint
CREATE INDEX "idx_credit_note_applications_cn" ON "commerce"."credit_note_applications" ("credit_note_id");--> statement-breakpoint
CREATE INDEX "idx_credit_note_applications_invoice" ON "commerce"."credit_note_applications" ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_credit_notes_site" ON "commerce"."credit_notes" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_customers_site" ON "commerce"."customers" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_customers_phone" ON "commerce"."customers" ("phone");--> statement-breakpoint
CREATE INDEX "idx_customers_email" ON "commerce"."customers" ("email");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_items_receipt" ON "commerce"."goods_receipt_items" ("goods_receipt_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_items_inventory" ON "commerce"."goods_receipt_items" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_items_uom" ON "commerce"."goods_receipt_items" ("uom_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_line_items_line" ON "commerce"."goods_receipt_line_items" ("goods_receipt_line_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_lines_item" ON "commerce"."goods_receipt_lines" ("goods_receipt_item_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_lines_lot" ON "commerce"."goods_receipt_lines" ("goods_receipt_lot_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_lines_location" ON "commerce"."goods_receipt_lines" ("location_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_lines_resolved" ON "commerce"."goods_receipt_lines" ("resolved_quant_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_lots_item" ON "commerce"."goods_receipt_lots" ("goods_receipt_item_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipt_lots_resolved" ON "commerce"."goods_receipt_lots" ("resolved_lot_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipts_supplier" ON "commerce"."goods_receipts" ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipts_po" ON "commerce"."goods_receipts" ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipts_site" ON "commerce"."goods_receipts" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_costs_source" ON "commerce"."inventory_item_costs" ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_costs_category" ON "commerce"."inventory_item_costs" ("category_id","source_type","source_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_costs_created_at" ON "commerce"."inventory_item_costs" ("created_at");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_ledger_item" ON "commerce"."inventory_item_ledger" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_ledger_site" ON "commerce"."inventory_item_ledger" ("site_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_ledger_ref" ON "commerce"."inventory_item_ledger" ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_ledger_created" ON "commerce"."inventory_item_ledger" ("inventory_item_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_iil_one_preferred" ON "commerce"."inventory_item_locations" ("inventory_item_id","site_id") WHERE is_preferred = true;--> statement-breakpoint
CREATE INDEX "idx_inventory_item_locations_item" ON "commerce"."inventory_item_locations" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_locations_location" ON "commerce"."inventory_item_locations" ("location_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_lots_item" ON "commerce"."inventory_item_lots" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_lots_expiry" ON "commerce"."inventory_item_lots" ("expiry_date");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_mrps_uom" ON "commerce"."inventory_item_mrps" ("uom_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_quant_costs_cost" ON "commerce"."inventory_item_quant_costs" ("cost_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_quants_item" ON "commerce"."inventory_item_quants" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_quants_location" ON "commerce"."inventory_item_quants" ("location_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_quants_item_location" ON "commerce"."inventory_item_quants" ("inventory_item_id","location_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_quants_item_location_lot" ON "commerce"."inventory_item_quants" ("inventory_item_id","location_id","lot_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_quants_lot" ON "commerce"."inventory_item_quants" ("lot_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_quants_supplier" ON "commerce"."inventory_item_quants" ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_quants_source" ON "commerce"."inventory_item_quants" ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_quants_active" ON "commerce"."inventory_item_quants" ("inventory_item_id","location_id") WHERE "quantity" > 0;--> statement-breakpoint
CREATE INDEX "idx_inventory_item_serials_quant" ON "commerce"."inventory_item_serials" ("inventory_item_quant_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_serials_item" ON "commerce"."inventory_item_serials" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_serials_quant_status" ON "commerce"."inventory_item_serials" ("inventory_item_quant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_iiuc_item_uom" ON "commerce"."inventory_item_uom_conversions" ("inventory_item_id","uom_id");--> statement-breakpoint
CREATE INDEX "idx_iiuc_item" ON "commerce"."inventory_item_uom_conversions" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_items_category" ON "commerce"."inventory_items" ("category_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_items_feed" ON "commerce"."inventory_items" ("organization_id","created_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "idx_inventory_items_name" ON "commerce"."inventory_items" ("organization_id","name","id");--> statement-breakpoint
CREATE INDEX "idx_inventory_items_code_sort" ON "commerce"."inventory_items" ("organization_id","code","id");--> statement-breakpoint
CREATE INDEX "idx_invoice_items_invoice" ON "commerce"."invoice_items" ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_site" ON "commerce"."invoices" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_party" ON "commerce"."invoices" ("party_type","party_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_item_field_value" ON "commerce"."item_field_values" ("item_id","field_definition_id");--> statement-breakpoint
CREATE INDEX "idx_locations_site" ON "commerce"."locations" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_locations_parent" ON "commerce"."locations" ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_locations_path" ON "commerce"."locations" USING gist ("path");--> statement-breakpoint
CREATE INDEX "idx_modifier_groups_site" ON "commerce"."modifier_groups" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_modifier_groups_catalog" ON "commerce"."modifier_groups" ("catalog_id");--> statement-breakpoint
CREATE INDEX "idx_modifier_options_group" ON "commerce"."modifier_options" ("group_id");--> statement-breakpoint
CREATE INDEX "idx_offering_options_offering" ON "commerce"."offering_options" ("offering_id");--> statement-breakpoint
CREATE INDEX "idx_offering_variant_components_item" ON "commerce"."offering_variant_components" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_offering_variant_option_values_value" ON "commerce"."offering_variant_option_values" ("variant_option_value_id");--> statement-breakpoint
CREATE INDEX "idx_offering_variants_offering" ON "commerce"."offering_variants" ("offering_id");--> statement-breakpoint
CREATE INDEX "idx_offerings_site" ON "commerce"."offerings" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_offerings_catalog" ON "commerce"."offerings" ("catalog_id");--> statement-breakpoint
CREATE INDEX "idx_offerings_category" ON "commerce"."offerings" ("category_id");--> statement-breakpoint
CREATE INDEX "idx_order_item_modifiers_item" ON "commerce"."order_item_modifiers" ("order_item_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_order" ON "commerce"."order_items" ("order_id");--> statement-breakpoint
CREATE INDEX "idx_orders_site" ON "commerce"."orders" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "commerce"."orders" ("status");--> statement-breakpoint
CREATE INDEX "idx_parties_org" ON "commerce"."parties" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_parties_type" ON "commerce"."parties" ("party_type");--> statement-breakpoint
CREATE INDEX "idx_party_addresses_party" ON "commerce"."party_addresses" ("party_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_party_bank_accounts_primary" ON "commerce"."party_bank_accounts" ("party_id") WHERE is_primary = true;--> statement-breakpoint
CREATE INDEX "idx_party_bank_accounts_party" ON "commerce"."party_bank_accounts" ("party_id");--> statement-breakpoint
CREATE INDEX "idx_party_communication_apps_comm" ON "commerce"."party_communication_apps" ("communication_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_party_communications_primary" ON "commerce"."party_communications" ("party_id","channel") WHERE is_primary = true;--> statement-breakpoint
CREATE INDEX "idx_party_communications_party" ON "commerce"."party_communications" ("party_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_party_functions_primary" ON "commerce"."party_functions" ("party_id","function") WHERE is_primary = true;--> statement-breakpoint
CREATE INDEX "idx_party_functions_party_function" ON "commerce"."party_functions" ("party_id","function");--> statement-breakpoint
CREATE INDEX "idx_party_identifiers_party" ON "commerce"."party_identifiers" ("party_id");--> statement-breakpoint
CREATE INDEX "idx_party_licenses_party" ON "commerce"."party_licenses" ("party_id");--> statement-breakpoint
CREATE INDEX "idx_party_rel_parent" ON "commerce"."party_relationships" ("parent_party_id");--> statement-breakpoint
CREATE INDEX "idx_party_social_profiles_party" ON "commerce"."party_social_profiles" ("party_id");--> statement-breakpoint
CREATE INDEX "idx_party_tax_reg_party" ON "commerce"."party_tax_registrations" ("party_id");--> statement-breakpoint
CREATE INDEX "idx_payments_invoice" ON "commerce"."payments" ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_pos_terminals_site" ON "commerce"."pos_terminals" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_pos_terminals_location" ON "commerce"."pos_terminals" ("location_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_order_items_po" ON "commerce"."purchase_order_items" ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_site" ON "commerce"."purchase_orders" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_supplier" ON "commerce"."purchase_orders" ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_sales_channels_org" ON "commerce"."sales_channels" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_sales_channels_kind" ON "commerce"."sales_channels" ("kind");--> statement-breakpoint
CREATE INDEX "idx_sa_line_items_line" ON "commerce"."stock_adjustment_line_items" ("stock_adjustment_line_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustment_lines_adjustment" ON "commerce"."stock_adjustment_lines" ("stock_adjustment_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustment_lines_lot" ON "commerce"."stock_adjustment_lines" ("stock_adjustment_lot_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustment_lines_quant" ON "commerce"."stock_adjustment_lines" ("quant_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustment_lines_resolved" ON "commerce"."stock_adjustment_lines" ("resolved_quant_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustment_lines_uom" ON "commerce"."stock_adjustment_lines" ("uom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_stock_adjustment_lines_lot_location_uom" ON "commerce"."stock_adjustment_lines" ("stock_adjustment_id","stock_adjustment_lot_id","location_id","uom_id") WHERE "quant_id" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_stock_adjustment_lots_adj" ON "commerce"."stock_adjustment_lots" ("stock_adjustment_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustment_lots_resolved" ON "commerce"."stock_adjustment_lots" ("resolved_lot_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustments_site" ON "commerce"."stock_adjustments" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustments_item" ON "commerce"."stock_adjustments" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustments_status" ON "commerce"."stock_adjustments" ("status");--> statement-breakpoint
CREATE INDEX "idx_stock_transfers_item" ON "commerce"."stock_transfers" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_stock_transfers_from_site" ON "commerce"."stock_transfers" ("from_site_id");--> statement-breakpoint
CREATE INDEX "idx_stock_transfers_to_site" ON "commerce"."stock_transfers" ("to_site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_item_prices_site_from" ON "commerce"."supplier_item_prices" ("supplier_item_id","site_id","valid_from") WHERE site_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_item_prices_general_from" ON "commerce"."supplier_item_prices" ("supplier_item_id","valid_from") WHERE site_id IS NULL;--> statement-breakpoint
CREATE INDEX "idx_supplier_item_prices_item" ON "commerce"."supplier_item_prices" ("supplier_item_id","valid_from");--> statement-breakpoint
CREATE INDEX "idx_supplier_item_prices_site" ON "commerce"."supplier_item_prices" ("site_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_item_sites_site" ON "commerce"."supplier_item_sites" ("site_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_sites_supplier" ON "commerce"."supplier_sites" ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_sites_site" ON "commerce"."supplier_sites" ("site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_items_supplier_item_uom" ON "commerce"."supplier_items" ("supplier_id","inventory_item_id","uom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_items_preferred" ON "commerce"."supplier_items" ("inventory_item_id") WHERE is_preferred = true;--> statement-breakpoint
CREATE INDEX "idx_supplier_items_supplier" ON "commerce"."supplier_items" ("supplier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_suppliers_le_code" ON "commerce"."suppliers" ("legal_entity_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_suppliers_le_party" ON "commerce"."suppliers" ("legal_entity_id","party_id");--> statement-breakpoint
CREATE INDEX "idx_suppliers_le" ON "commerce"."suppliers" ("organization_id","legal_entity_id");--> statement-breakpoint
CREATE INDEX "idx_suppliers_party" ON "commerce"."suppliers" ("party_id");--> statement-breakpoint
CREATE INDEX "idx_tax_classes_org" ON "commerce"."tax_classes" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_tax_components_org" ON "commerce"."tax_components" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tax_groups_le_name_unique" ON "commerce"."tax_groups" ("legal_entity_id","name");--> statement-breakpoint
CREATE INDEX "idx_tax_jurisdictions_org" ON "commerce"."tax_jurisdictions" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_tax_jurisdictions_parent" ON "commerce"."tax_jurisdictions" ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_uom_org_symbol" ON "commerce"."uom" ("organization_id","symbol");--> statement-breakpoint
CREATE INDEX "idx_uom_org" ON "commerce"."uom" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_uom_dimension" ON "commerce"."uom" ("dimension_id");--> statement-breakpoint
CREATE INDEX "idx_uom_dimensions_org" ON "commerce"."uom_dimensions" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_variant_option_values_option" ON "commerce"."variant_option_values" ("variant_option_id");--> statement-breakpoint
CREATE INDEX "idx_variant_options_catalog" ON "commerce"."variant_options" ("catalog_id");--> statement-breakpoint
ALTER TABLE "commerce"."catalog_channels" ADD CONSTRAINT "catalog_channels_catalog_id_catalogs_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "commerce"."catalogs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."catalog_channels" ADD CONSTRAINT "catalog_channels_channel_id_sales_channels_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "commerce"."sales_channels"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."categories" ADD CONSTRAINT "categories_default_tax_class_id_tax_classes_id_fkey" FOREIGN KEY ("default_tax_class_id") REFERENCES "commerce"."tax_classes"("id");--> statement-breakpoint
ALTER TABLE "commerce"."credit_note_applications" ADD CONSTRAINT "credit_note_applications_credit_note_id_credit_notes_id_fkey" FOREIGN KEY ("credit_note_id") REFERENCES "commerce"."credit_notes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."credit_note_applications" ADD CONSTRAINT "credit_note_applications_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "commerce"."invoices"("id");--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_goods_receipt_id_goods_receipts_id_fkey" FOREIGN KEY ("goods_receipt_id") REFERENCES "commerce"."goods_receipts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "commerce"."inventory_items"("id");--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "commerce"."uom"("id");--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipt_line_items" ADD CONSTRAINT "goods_receipt_line_items_xPce4mspmdCq_fkey" FOREIGN KEY ("goods_receipt_line_id") REFERENCES "commerce"."goods_receipt_lines"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_LCQNKaQNEtiW_fkey" FOREIGN KEY ("goods_receipt_item_id") REFERENCES "commerce"."goods_receipt_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_V70jEkCkMhay_fkey" FOREIGN KEY ("goods_receipt_lot_id") REFERENCES "commerce"."goods_receipt_lots"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "commerce"."locations"("id");--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_bDwzM4gXMdkg_fkey" FOREIGN KEY ("resolved_quant_id") REFERENCES "commerce"."inventory_item_quants"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipt_lots" ADD CONSTRAINT "goods_receipt_lots_CLiJ36meIGXj_fkey" FOREIGN KEY ("goods_receipt_item_id") REFERENCES "commerce"."goods_receipt_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipt_lots" ADD CONSTRAINT "goods_receipt_lots_resolved_lot_id_inventory_item_lots_id_fkey" FOREIGN KEY ("resolved_lot_id") REFERENCES "commerce"."inventory_item_lots"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipts" ADD CONSTRAINT "goods_receipts_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "commerce"."suppliers"("id");--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipts" ADD CONSTRAINT "goods_receipts_purchase_order_id_purchase_orders_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "commerce"."purchase_orders"("id");--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_costs" ADD CONSTRAINT "inventory_item_costs_category_id_cost_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "commerce"."cost_categories"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_ledger" ADD CONSTRAINT "inventory_item_ledger_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "commerce"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_locations" ADD CONSTRAINT "inventory_item_locations_a712NwWdDuJg_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "commerce"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_locations" ADD CONSTRAINT "inventory_item_locations_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "commerce"."locations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_lots" ADD CONSTRAINT "inventory_item_lots_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "commerce"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_mrps" ADD CONSTRAINT "inventory_item_mrps_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "commerce"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_mrps" ADD CONSTRAINT "inventory_item_mrps_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "commerce"."uom"("id");--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_mrps" ADD CONSTRAINT "inventory_item_mrps_source_lot_id_inventory_item_lots_id_fkey" FOREIGN KEY ("source_lot_id") REFERENCES "commerce"."inventory_item_lots"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_quant_costs" ADD CONSTRAINT "inventory_item_quant_costs_c3KpiPKUQ4N1_fkey" FOREIGN KEY ("quant_id") REFERENCES "commerce"."inventory_item_quants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_quant_costs" ADD CONSTRAINT "inventory_item_quant_costs_cost_id_inventory_item_costs_id_fkey" FOREIGN KEY ("cost_id") REFERENCES "commerce"."inventory_item_costs"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_quants" ADD CONSTRAINT "inventory_item_quants_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "commerce"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_quants" ADD CONSTRAINT "inventory_item_quants_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "commerce"."locations"("id");--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_quants" ADD CONSTRAINT "inventory_item_quants_lot_id_inventory_item_lots_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "commerce"."inventory_item_lots"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_quants" ADD CONSTRAINT "inventory_item_quants_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "commerce"."suppliers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_serials" ADD CONSTRAINT "inventory_item_serials_s63VhASWzVvD_fkey" FOREIGN KEY ("inventory_item_quant_id") REFERENCES "commerce"."inventory_item_quants"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_serials" ADD CONSTRAINT "inventory_item_serials_OfOoSAD2LK8t_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "commerce"."inventory_items"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_sites" ADD CONSTRAINT "inventory_item_sites_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "commerce"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_uom_conversions" ADD CONSTRAINT "inventory_item_uom_conversions_rzKG09lM3ksH_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "commerce"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_uom_conversions" ADD CONSTRAINT "inventory_item_uom_conversions_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "commerce"."uom"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_items" ADD CONSTRAINT "inventory_items_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "commerce"."categories"("id");--> statement-breakpoint
ALTER TABLE "commerce"."inventory_items" ADD CONSTRAINT "inventory_items_tax_class_id_tax_classes_id_fkey" FOREIGN KEY ("tax_class_id") REFERENCES "commerce"."tax_classes"("id");--> statement-breakpoint
ALTER TABLE "commerce"."inventory_items" ADD CONSTRAINT "inventory_items_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "commerce"."uom"("id");--> statement-breakpoint
ALTER TABLE "commerce"."invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "commerce"."invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."item_field_values" ADD CONSTRAINT "item_field_values_item_id_offerings_id_fkey" FOREIGN KEY ("item_id") REFERENCES "commerce"."offerings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."item_field_values" ADD CONSTRAINT "item_field_values_V0gaE4dkunFk_fkey" FOREIGN KEY ("field_definition_id") REFERENCES "commerce"."item_field_definitions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."modifier_groups" ADD CONSTRAINT "modifier_groups_catalog_id_catalogs_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "commerce"."catalogs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."offering_options" ADD CONSTRAINT "offering_options_offering_id_offerings_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "commerce"."offerings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."offering_options" ADD CONSTRAINT "offering_options_variant_option_id_variant_options_id_fkey" FOREIGN KEY ("variant_option_id") REFERENCES "commerce"."variant_options"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."offering_variant_components" ADD CONSTRAINT "offering_variant_components_jN35xDMsfNj6_fkey" FOREIGN KEY ("offering_variant_id") REFERENCES "commerce"."offering_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."offering_variant_components" ADD CONSTRAINT "offering_variant_components_B1iN9sSqzSRm_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "commerce"."inventory_items"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."offering_variant_option_values" ADD CONSTRAINT "offering_variant_option_values_KYe3VBYNJOni_fkey" FOREIGN KEY ("variant_option_value_id") REFERENCES "commerce"."variant_option_values"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."offering_variants" ADD CONSTRAINT "offering_variants_tax_class_id_tax_classes_id_fkey" FOREIGN KEY ("tax_class_id") REFERENCES "commerce"."tax_classes"("id");--> statement-breakpoint
ALTER TABLE "commerce"."offerings" ADD CONSTRAINT "offerings_catalog_id_catalogs_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "commerce"."catalogs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."offerings" ADD CONSTRAINT "offerings_sales_tax_group_id_tax_groups_id_fkey" FOREIGN KEY ("sales_tax_group_id") REFERENCES "commerce"."tax_groups"("id");--> statement-breakpoint
ALTER TABLE "commerce"."order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_order_item_id_order_items_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "commerce"."order_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commerce"."orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."order_items" ADD CONSTRAINT "order_items_offering_id_offerings_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "commerce"."offerings"("id");--> statement-breakpoint
ALTER TABLE "commerce"."order_items" ADD CONSTRAINT "order_items_offering_variant_id_offering_variants_id_fkey" FOREIGN KEY ("offering_variant_id") REFERENCES "commerce"."offering_variants"("id");--> statement-breakpoint
ALTER TABLE "commerce"."orders" ADD CONSTRAINT "orders_channel_id_sales_channels_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "commerce"."sales_channels"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "commerce"."orders" ADD CONSTRAINT "orders_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "commerce"."customers"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "commerce"."parties" ADD CONSTRAINT "parties_jurisdiction_id_tax_jurisdictions_id_fkey" FOREIGN KEY ("jurisdiction_id") REFERENCES "commerce"."tax_jurisdictions"("id");--> statement-breakpoint
ALTER TABLE "commerce"."party_addresses" ADD CONSTRAINT "party_addresses_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "commerce"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."party_bank_accounts" ADD CONSTRAINT "party_bank_accounts_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "commerce"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."party_communication_apps" ADD CONSTRAINT "party_communication_apps_HpL6A3GLe64m_fkey" FOREIGN KEY ("communication_id") REFERENCES "commerce"."party_communications"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."party_communications" ADD CONSTRAINT "party_communications_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "commerce"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."party_functions" ADD CONSTRAINT "party_functions_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "commerce"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."party_functions" ADD CONSTRAINT "fk_party_functions_address" FOREIGN KEY ("party_id","party_address_id") REFERENCES "commerce"."party_addresses"("party_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."party_functions" ADD CONSTRAINT "fk_party_functions_relationship" FOREIGN KEY ("party_id","party_relationship_id") REFERENCES "commerce"."party_relationships"("parent_party_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."party_identifiers" ADD CONSTRAINT "party_identifiers_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "commerce"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."party_licenses" ADD CONSTRAINT "party_licenses_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "commerce"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."party_relationships" ADD CONSTRAINT "party_relationships_parent_party_id_parties_id_fkey" FOREIGN KEY ("parent_party_id") REFERENCES "commerce"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."party_relationships" ADD CONSTRAINT "party_relationships_child_party_id_parties_id_fkey" FOREIGN KEY ("child_party_id") REFERENCES "commerce"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."party_social_profiles" ADD CONSTRAINT "party_social_profiles_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "commerce"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."party_tax_registrations" ADD CONSTRAINT "party_tax_registrations_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "commerce"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."party_tax_registrations" ADD CONSTRAINT "party_tax_registrations_xGgR76RblL4y_fkey" FOREIGN KEY ("jurisdiction_id") REFERENCES "commerce"."tax_jurisdictions"("id");--> statement-breakpoint
ALTER TABLE "commerce"."payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "commerce"."invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."pos_terminals" ADD CONSTRAINT "pos_terminals_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "commerce"."locations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."pos_terminals" ADD CONSTRAINT "pos_terminals_catalog_id_catalogs_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "commerce"."catalogs"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "commerce"."purchase_orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "commerce"."inventory_items"("id");--> statement-breakpoint
ALTER TABLE "commerce"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "commerce"."uom"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "commerce"."suppliers"("id");--> statement-breakpoint
ALTER TABLE "commerce"."stock_adjustment_line_items" ADD CONSTRAINT "stock_adjustment_line_items_BAKtyY4jjSIv_fkey" FOREIGN KEY ("stock_adjustment_line_id") REFERENCES "commerce"."stock_adjustment_lines"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."stock_adjustment_lines" ADD CONSTRAINT "stock_adjustment_lines_V8pV4VOOh3IT_fkey" FOREIGN KEY ("stock_adjustment_id") REFERENCES "commerce"."stock_adjustments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."stock_adjustment_lines" ADD CONSTRAINT "stock_adjustment_lines_DEs4DyxRxJef_fkey" FOREIGN KEY ("stock_adjustment_lot_id") REFERENCES "commerce"."stock_adjustment_lots"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."stock_adjustment_lines" ADD CONSTRAINT "stock_adjustment_lines_location_id_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "commerce"."locations"("id");--> statement-breakpoint
ALTER TABLE "commerce"."stock_adjustment_lines" ADD CONSTRAINT "stock_adjustment_lines_quant_id_inventory_item_quants_id_fkey" FOREIGN KEY ("quant_id") REFERENCES "commerce"."inventory_item_quants"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "commerce"."stock_adjustment_lines" ADD CONSTRAINT "stock_adjustment_lines_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "commerce"."uom"("id");--> statement-breakpoint
ALTER TABLE "commerce"."stock_adjustment_lines" ADD CONSTRAINT "stock_adjustment_lines_0KyHHNwJ6NwT_fkey" FOREIGN KEY ("resolved_quant_id") REFERENCES "commerce"."inventory_item_quants"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "commerce"."stock_adjustment_lots" ADD CONSTRAINT "stock_adjustment_lots_QCXPZmh9zfIK_fkey" FOREIGN KEY ("stock_adjustment_id") REFERENCES "commerce"."stock_adjustments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."stock_adjustment_lots" ADD CONSTRAINT "stock_adjustment_lots_2xbHGAUPqlLg_fkey" FOREIGN KEY ("resolved_lot_id") REFERENCES "commerce"."inventory_item_lots"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "commerce"."stock_adjustments" ADD CONSTRAINT "stock_adjustments_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "commerce"."inventory_items"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."stock_transfers" ADD CONSTRAINT "stock_transfers_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "commerce"."inventory_items"("id");--> statement-breakpoint
ALTER TABLE "commerce"."supplier_item_prices" ADD CONSTRAINT "supplier_item_prices_supplier_item_id_supplier_items_id_fkey" FOREIGN KEY ("supplier_item_id") REFERENCES "commerce"."supplier_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_item_sites" ADD CONSTRAINT "supplier_item_sites_supplier_item_id_supplier_items_id_fkey" FOREIGN KEY ("supplier_item_id") REFERENCES "commerce"."supplier_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_sites" ADD CONSTRAINT "supplier_sites_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "commerce"."suppliers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_sites" ADD CONSTRAINT "fk_supplier_sites_tax_registration" FOREIGN KEY ("party_tax_registration_id") REFERENCES "commerce"."party_tax_registrations"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_sites" ADD CONSTRAINT "fk_supplier_sites_bank_account" FOREIGN KEY ("party_bank_account_id") REFERENCES "commerce"."party_bank_accounts"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_sites" ADD CONSTRAINT "fk_supplier_sites_order_relationship" FOREIGN KEY ("order_relationship_id") REFERENCES "commerce"."party_relationships"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_items" ADD CONSTRAINT "supplier_items_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "commerce"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_items" ADD CONSTRAINT "supplier_items_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "commerce"."uom"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_items" ADD CONSTRAINT "fk_supplier_items_supplier_currency" FOREIGN KEY ("supplier_id","currency_code") REFERENCES "commerce"."suppliers"("id","currency_code") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."suppliers" ADD CONSTRAINT "suppliers_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "commerce"."parties"("id");--> statement-breakpoint
ALTER TABLE "commerce"."tax_jurisdictions" ADD CONSTRAINT "tax_jurisdictions_parent_id_tax_jurisdictions_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "commerce"."tax_jurisdictions"("id");--> statement-breakpoint
ALTER TABLE "commerce"."tax_rates" ADD CONSTRAINT "tax_rates_tax_group_id_tax_groups_id_fkey" FOREIGN KEY ("tax_group_id") REFERENCES "commerce"."tax_groups"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."uom" ADD CONSTRAINT "uom_dimension_id_uom_dimensions_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "commerce"."uom_dimensions"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."variant_option_values" ADD CONSTRAINT "variant_option_values_variant_option_id_variant_options_id_fkey" FOREIGN KEY ("variant_option_id") REFERENCES "commerce"."variant_options"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."variant_options" ADD CONSTRAINT "variant_options_catalog_id_catalogs_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "commerce"."catalogs"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE VIEW "commerce"."inventory_stock_levels" AS (select COALESCE("q"."inventory_item_id", "commerce"."inventory_item_locations"."inventory_item_id") as "inventory_item_id", COALESCE("q"."location_id", "commerce"."inventory_item_locations"."location_id") as "location_id", CAST(COALESCE("q"."stocked", 0) AS TEXT) as "stocked_quantity", CAST(COALESCE("q"."reserved", 0) AS TEXT) as "reserved_quantity", CAST(COALESCE("q"."available", 0) AS TEXT) as "available_quantity", "commerce"."inventory_item_locations"."min_level" from (select "inventory_item_id", "location_id", SUM("quantity") as "stocked", SUM("reserved_quantity") as "reserved", SUM("quantity" - "reserved_quantity") as "available" from "commerce"."inventory_item_quants" group by "commerce"."inventory_item_quants"."inventory_item_id", "commerce"."inventory_item_quants"."location_id") "q" full join "commerce"."inventory_item_locations" on "q"."inventory_item_id" = "commerce"."inventory_item_locations"."inventory_item_id" AND "q"."location_id" = "commerce"."inventory_item_locations"."location_id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."catalog_channels" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."catalog_channels" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."catalog_channels" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."catalog_channels" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."catalog_channels" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."catalogs" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."catalogs" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."catalogs" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."catalogs" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."catalogs" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."categories" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."cost_categories" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."credit_notes" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."credit_notes" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."credit_notes" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."credit_notes" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."credit_notes" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."customers" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."customers" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."customers" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."customers" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."customers" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."document_counters" AS PERMISSIVE FOR ALL TO public USING ("commerce"."document_counters"."organization_id" = (select current_setting('app.org_id', true)::uuid)) WITH CHECK ("commerce"."document_counters"."organization_id" = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."goods_receipt_items" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."goods_receipt_items" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."goods_receipt_items" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."goods_receipt_items" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."goods_receipt_items" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."goods_receipt_line_items" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."goods_receipt_line_items" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."goods_receipt_line_items" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."goods_receipt_line_items" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."goods_receipt_line_items" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."goods_receipt_lines" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."goods_receipt_lines" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."goods_receipt_lines" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."goods_receipt_lines" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."goods_receipt_lines" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."goods_receipt_lots" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."goods_receipt_lots" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."goods_receipt_lots" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."goods_receipt_lots" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."goods_receipt_lots" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."goods_receipts" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."goods_receipts" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."goods_receipts" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."goods_receipts" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."goods_receipts" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."inventory_item_costs" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."inventory_item_locations" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."inventory_item_locations" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."inventory_item_locations" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."inventory_item_locations" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."inventory_item_locations" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."inventory_item_lots" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."inventory_item_lots" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."inventory_item_lots" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."inventory_item_lots" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."inventory_item_lots" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."inventory_item_mrps" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."inventory_item_quant_costs" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."inventory_item_quants" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."inventory_item_quants" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."inventory_item_quants" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."inventory_item_quants" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."inventory_item_quants" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."inventory_item_serials" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."inventory_item_serials" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."inventory_item_serials" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."inventory_item_serials" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."inventory_item_serials" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."inventory_item_sites" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."inventory_item_sites" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."inventory_item_sites" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."inventory_item_sites" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."inventory_item_sites" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."inventory_item_uom_conversions" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."inventory_items" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."invoices" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."invoices" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."invoices" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."invoices" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."invoices" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."item_field_definitions" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."item_field_definitions" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."item_field_definitions" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."item_field_definitions" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."item_field_definitions" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."locations" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."locations" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."locations" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."locations" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."locations" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."modifier_groups" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."modifier_groups" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."modifier_groups" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."modifier_groups" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."modifier_groups" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."offering_variant_components" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."offerings" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."offerings" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."offerings" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."offerings" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."offerings" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."orders" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."orders" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."orders" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."orders" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."orders" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."parties" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."party_addresses" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."party_bank_accounts" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."party_communication_apps" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."party_communications" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."party_functions" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."party_identifiers" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."party_licenses" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."party_relationships" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."party_social_profiles" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."party_tax_registrations" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."pos_terminals" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."pos_terminals" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."pos_terminals" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."pos_terminals" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."pos_terminals" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."purchase_orders" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."purchase_orders" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."purchase_orders" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."purchase_orders" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."purchase_orders" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."sales_channels" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."stock_adjustment_line_items" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."stock_adjustment_line_items" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."stock_adjustment_line_items" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."stock_adjustment_line_items" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."stock_adjustment_line_items" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."stock_adjustment_lines" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."stock_adjustment_lines" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."stock_adjustment_lines" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."stock_adjustment_lines" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."stock_adjustment_lines" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."stock_adjustment_lots" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."stock_adjustment_lots" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."stock_adjustment_lots" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."stock_adjustment_lots" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."stock_adjustment_lots" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."stock_adjustments" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."stock_adjustments" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."stock_adjustments" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."stock_adjustments" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."stock_adjustments" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."stock_transfers" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."supplier_item_prices" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."supplier_item_prices" AS PERMISSIVE FOR SELECT TO public USING (site_id IS NULL OR site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."supplier_item_prices" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."supplier_item_prices" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."supplier_item_prices" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."supplier_item_sites" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."supplier_item_sites" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."supplier_item_sites" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."supplier_item_sites" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."supplier_item_sites" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."supplier_sites" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "le_read" ON "commerce"."supplier_sites" AS PERMISSIVE FOR SELECT TO public USING (legal_entity_id = (select current_setting('app.le_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "le_write" ON "commerce"."supplier_sites" AS PERMISSIVE FOR INSERT TO public WITH CHECK (legal_entity_id = (select current_setting('app.le_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "le_update" ON "commerce"."supplier_sites" AS PERMISSIVE FOR UPDATE TO public USING (legal_entity_id = (select current_setting('app.le_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "le_delete" ON "commerce"."supplier_sites" AS PERMISSIVE FOR DELETE TO public USING (legal_entity_id = (select current_setting('app.le_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "commerce"."supplier_sites" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "commerce"."supplier_sites" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "commerce"."supplier_sites" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "commerce"."supplier_sites" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."suppliers" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "le_read" ON "commerce"."suppliers" AS PERMISSIVE FOR SELECT TO public USING (legal_entity_id = (select current_setting('app.le_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "le_write" ON "commerce"."suppliers" AS PERMISSIVE FOR INSERT TO public WITH CHECK (legal_entity_id = (select current_setting('app.le_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "le_update" ON "commerce"."suppliers" AS PERMISSIVE FOR UPDATE TO public USING (legal_entity_id = (select current_setting('app.le_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "le_delete" ON "commerce"."suppliers" AS PERMISSIVE FOR DELETE TO public USING (legal_entity_id = (select current_setting('app.le_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."tax_classes" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."tax_components" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."tax_groups" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "le_read" ON "commerce"."tax_groups" AS PERMISSIVE FOR SELECT TO public USING (legal_entity_id = (select current_setting('app.le_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "le_write" ON "commerce"."tax_groups" AS PERMISSIVE FOR INSERT TO public WITH CHECK (legal_entity_id = (select current_setting('app.le_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "le_update" ON "commerce"."tax_groups" AS PERMISSIVE FOR UPDATE TO public USING (legal_entity_id = (select current_setting('app.le_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "le_delete" ON "commerce"."tax_groups" AS PERMISSIVE FOR DELETE TO public USING (legal_entity_id = (select current_setting('app.le_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."tax_jurisdictions" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."uom" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."uom_dimensions" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."variant_option_values" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."variant_options" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));