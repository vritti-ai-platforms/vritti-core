ALTER TYPE "commerce"."purchase_order_billing_status" RENAME TO "purchase_order_invoice_status";--> statement-breakpoint
ALTER TABLE "commerce"."goods_receipts" RENAME COLUMN "published_at" TO "posted_at";--> statement-breakpoint
ALTER TABLE "commerce"."purchase_order_items" RENAME COLUMN "billed_primary_qty" TO "invoiced_primary_qty";--> statement-breakpoint
ALTER TABLE "commerce"."purchase_orders" RENAME COLUMN "billing_status" TO "invoice_status";--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" RENAME COLUMN "billed_qty" TO "invoiced_qty";--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" RENAME COLUMN "billed_primary_qty" TO "invoiced_primary_qty";--> statement-breakpoint
ALTER TABLE "commerce"."supplier_invoice_lines" DROP CONSTRAINT "supplier_invoice_lines_item_chk", ADD CONSTRAINT "supplier_invoice_lines_item_chk" CHECK ("line_type" <> 'ITEM' OR ("purchase_order_item_id" IS NOT NULL AND "inventory_item_id" IS NOT NULL AND "uom_id" IS NOT NULL AND "invoiced_qty" IS NOT NULL AND "free_qty" IS NOT NULL AND "invoiced_primary_qty" IS NOT NULL AND "free_primary_qty" IS NOT NULL AND "cost_category_id" IS NULL));