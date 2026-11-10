CREATE TYPE "commerce"."inbound_delivery_status" AS ENUM('PLANNED', 'IN_TRANSIT', 'ARRIVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "commerce"."inbound_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"legal_entity_id" uuid DEFAULT cast(nullif(current_setting('app.le_id', true), '') as uuid) NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id') as uuid) NOT NULL,
	"supplier_id" uuid NOT NULL,
	"delivery_number" varchar(50) NOT NULL,
	"status" "commerce"."inbound_delivery_status" DEFAULT 'PLANNED'::"commerce"."inbound_delivery_status" NOT NULL,
	"expected_delivery_date" date NOT NULL,
	"carrier" varchar(100),
	"tracking_number" varchar(100),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inbound_deliveries_org_delivery_number" UNIQUE("organization_id","delivery_number")
);
--> statement-breakpoint
ALTER TABLE "commerce"."inbound_deliveries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."inbound_delivery_lines" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"inbound_delivery_id" uuid NOT NULL,
	"purchase_order_item_id" uuid NOT NULL,
	"quantity" numeric(12,3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inbound_delivery_lines_delivery_po_item" UNIQUE("inbound_delivery_id","purchase_order_item_id"),
	CONSTRAINT "inbound_delivery_lines_quantity_chk" CHECK ("quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "commerce"."inbound_delivery_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipts" ADD COLUMN "inbound_delivery_id" uuid;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_order_items" ADD COLUMN "expected_delivery_date" date;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_order_items" ADD COLUMN "tax_date" date;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_order_items" ADD COLUMN "is_tax_date_overridden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_orders" ADD COLUMN "tax_date" date;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoices" ADD COLUMN "tax_date" date;--> statement-breakpoint
CREATE INDEX "idx_goods_receipts_inbound_delivery" ON "commerce"."goods_receipts" ("inbound_delivery_id");--> statement-breakpoint
CREATE INDEX "idx_inbound_deliveries_site" ON "commerce"."inbound_deliveries" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_inbound_deliveries_supplier" ON "commerce"."inbound_deliveries" ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_inbound_delivery_lines_po_item" ON "commerce"."inbound_delivery_lines" ("purchase_order_item_id");--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipts" ADD CONSTRAINT "goods_receipts_inbound_delivery_id_inbound_deliveries_id_fkey" FOREIGN KEY ("inbound_delivery_id") REFERENCES "commerce"."inbound_deliveries"("id");--> statement-breakpoint
ALTER TABLE "commerce"."inbound_deliveries" ADD CONSTRAINT "inbound_deliveries_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "commerce"."suppliers"("id");--> statement-breakpoint
ALTER TABLE "commerce"."inbound_delivery_lines" ADD CONSTRAINT "inbound_delivery_lines_qANCNy01QHh6_fkey" FOREIGN KEY ("inbound_delivery_id") REFERENCES "commerce"."inbound_deliveries"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."inbound_delivery_lines" ADD CONSTRAINT "inbound_delivery_lines_QrkhvM1WANUL_fkey" FOREIGN KEY ("purchase_order_item_id") REFERENCES "commerce"."purchase_order_items"("id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."inbound_deliveries" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "reach_read" ON "commerce"."inbound_deliveries" AS RESTRICTIVE FOR SELECT TO public USING (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then site_id = any(string_to_array(nullif(current_setting('app.site_ids', true), ''), ',')::uuid[])
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.org_id', true), '') as uuid) is not null then true
    else false
  end, false));--> statement-breakpoint
CREATE POLICY "owner_insert" ON "commerce"."inbound_deliveries" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false));--> statement-breakpoint
CREATE POLICY "owner_update" ON "commerce"."inbound_deliveries" AS RESTRICTIVE FOR UPDATE TO public USING (coalesce(
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
CREATE POLICY "owner_delete" ON "commerce"."inbound_deliveries" AS RESTRICTIVE FOR DELETE TO public USING (coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."inbound_delivery_lines" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "reach_read" ON "commerce"."inbound_delivery_lines" AS RESTRICTIVE FOR SELECT TO public USING (exists (select 1 from commerce.inbound_deliveries o where o.id = inbound_delivery_id));--> statement-breakpoint
CREATE POLICY "owner_insert" ON "commerce"."inbound_delivery_lines" AS RESTRICTIVE FOR INSERT TO public WITH CHECK (exists (select 1 from commerce.inbound_deliveries o where o.id = inbound_delivery_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)));--> statement-breakpoint
CREATE POLICY "owner_update" ON "commerce"."inbound_delivery_lines" AS RESTRICTIVE FOR UPDATE TO public USING (exists (select 1 from commerce.inbound_deliveries o where o.id = inbound_delivery_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)));--> statement-breakpoint
CREATE POLICY "owner_delete" ON "commerce"."inbound_delivery_lines" AS RESTRICTIVE FOR DELETE TO public USING (exists (select 1 from commerce.inbound_deliveries o where o.id = inbound_delivery_id and coalesce(
  case
    when cast(nullif(current_setting('app.site_id', true), '') as uuid) is not null then o.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) and o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid)
    when cast(nullif(current_setting('app.site_group_id', true), '') as uuid) is not null then false
    when cast(nullif(current_setting('app.le_id', true), '') as uuid) is not null then o.legal_entity_id = cast(nullif(current_setting('app.le_id', true), '') as uuid) and o.site_id is not null
      and (string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[] is null or o.site_id = any(string_to_array(nullif(current_setting('app.le_site_ids', true), ''), ',')::uuid[]))
    else false
  end, false)));