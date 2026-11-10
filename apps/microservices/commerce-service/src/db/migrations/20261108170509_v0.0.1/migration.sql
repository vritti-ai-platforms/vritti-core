ALTER TABLE "commerce"."goods_receipts" DROP CONSTRAINT "goods_receipts_purchase_order_id_purchase_orders_id_fkey";--> statement-breakpoint
DROP INDEX "commerce"."idx_goods_receipts_po";--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipts" DROP COLUMN "purchase_order_id";--> statement-breakpoint
ALTER TABLE "commerce"."purchase_orders" DROP COLUMN "expected_by";--> statement-breakpoint
ALTER TABLE "commerce"."purchase_order_items" ALTER COLUMN "expected_delivery_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_order_items" ALTER COLUMN "tax_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."purchase_orders" ALTER COLUMN "tax_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoices" ALTER COLUMN "tax_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_site_items" ALTER COLUMN "lead_time_days" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_site_items" ALTER COLUMN "lead_time_days" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_items" ALTER COLUMN "default_lead_time_days" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_items" ALTER COLUMN "default_lead_time_days" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_site_items" ADD CONSTRAINT "supplier_site_items_lead_time_chk" CHECK ("lead_time_days" between 0 and 365);--> statement-breakpoint
ALTER TABLE "commerce"."supplier_items" ADD CONSTRAINT "supplier_items_default_lead_time_chk" CHECK ("default_lead_time_days" between 0 and 365);