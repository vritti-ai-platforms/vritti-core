CREATE TYPE "vritti_core"."order_type" AS ENUM('DINE_IN', 'TAKEAWAY', 'DELIVERY');--> statement-breakpoint
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
CREATE INDEX "idx_order_item_modifiers_item" ON "vritti_core"."order_item_modifiers" ("order_item_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_order" ON "vritti_core"."order_items" ("order_id");--> statement-breakpoint
CREATE INDEX "idx_orders_bu" ON "vritti_core"."orders" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "vritti_core"."orders" ("status");--> statement-breakpoint
ALTER TABLE "vritti_core"."order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_order_item_id_order_items_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "vritti_core"."order_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "vritti_core"."orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."order_items" ADD CONSTRAINT "order_items_item_id_items_id_fkey" FOREIGN KEY ("item_id") REFERENCES "vritti_core"."items"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."order_items" ADD CONSTRAINT "order_items_variant_id_item_variants_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "vritti_core"."item_variants"("id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."orders" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."orders" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."orders" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."orders" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."orders" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);