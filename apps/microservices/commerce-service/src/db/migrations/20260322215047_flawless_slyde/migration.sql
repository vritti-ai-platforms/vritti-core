CREATE SCHEMA IF NOT EXISTS "vritti_core";
--> statement-breakpoint
CREATE TYPE "vritti_core"."invoice_status" AS ENUM('DRAFT', 'ISSUED', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "vritti_core"."order_item_status" AS ENUM('PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "vritti_core"."order_source" AS ENUM('ONLINE', 'WALK_IN');--> statement-breakpoint
CREATE TYPE "vritti_core"."order_status" AS ENUM('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "vritti_core"."payment_method" AS ENUM('CASH', 'UPI', 'CARD', 'WALLET', 'UNPAID');--> statement-breakpoint
CREATE TABLE "vritti_core"."stations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"business_unit_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"business_unit_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"image" varchar(255),
	"parent_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"business_unit_id" uuid NOT NULL,
	"category_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"image" varchar(255),
	"price" numeric NOT NULL,
	"station_id" uuid,
	"sku" varchar(100),
	"unit" varchar(50),
	"is_available" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"business_unit_id" uuid NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"source" "vritti_core"."order_source" NOT NULL,
	"status" "vritti_core"."order_status" DEFAULT 'PENDING'::"vritti_core"."order_status" NOT NULL,
	"customer_id" uuid,
	"customer_phone" varchar(20),
	"voop_order_id" varchar(255),
	"subtotal" numeric NOT NULL,
	"tax" numeric DEFAULT '0' NOT NULL,
	"discount" numeric DEFAULT '0' NOT NULL,
	"total" numeric NOT NULL,
	"notes" text,
	"payment_method" "vritti_core"."payment_method" DEFAULT 'UNPAID'::"vritti_core"."payment_method" NOT NULL,
	"paid_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"name" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric NOT NULL,
	"total" numeric NOT NULL,
	"notes" text,
	"station_id" uuid,
	"kot_number" integer,
	"status" "vritti_core"."order_item_status" DEFAULT 'PENDING'::"vritti_core"."order_item_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"business_unit_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"customer_id" uuid,
	"customer_phone" varchar(20),
	"customer_name" varchar(255),
	"items" jsonb NOT NULL,
	"subtotal" numeric NOT NULL,
	"tax" numeric DEFAULT '0' NOT NULL,
	"discount" numeric DEFAULT '0' NOT NULL,
	"total" numeric NOT NULL,
	"status" "vritti_core"."invoice_status" DEFAULT 'DRAFT'::"vritti_core"."invoice_status" NOT NULL,
	"issued_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."products" ADD CONSTRAINT "products_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "vritti_core"."categories"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."products" ADD CONSTRAINT "products_station_id_stations_id_fkey" FOREIGN KEY ("station_id") REFERENCES "vritti_core"."stations"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "vritti_core"."orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."order_items" ADD CONSTRAINT "order_items_station_id_stations_id_fkey" FOREIGN KEY ("station_id") REFERENCES "vritti_core"."stations"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."invoices" ADD CONSTRAINT "invoices_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "vritti_core"."orders"("id");