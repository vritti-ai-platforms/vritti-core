-- Custom SQL migration file, put your code below! --
DELETE FROM "commerce"."supplier_invoice_line_receipts";
--> statement-breakpoint
DELETE FROM "commerce"."supplier_invoice_lines";
--> statement-breakpoint
DELETE FROM "commerce"."supplier_invoices";
--> statement-breakpoint
DELETE FROM "commerce"."goods_receipt_line_items";
--> statement-breakpoint
DELETE FROM "commerce"."goods_receipt_lines";
--> statement-breakpoint
DELETE FROM "commerce"."goods_receipt_lots";
--> statement-breakpoint
DELETE FROM "commerce"."goods_receipt_items";
--> statement-breakpoint
DELETE FROM "commerce"."goods_receipts";
--> statement-breakpoint
DELETE FROM "commerce"."inbound_delivery_lines";
--> statement-breakpoint
DELETE FROM "commerce"."inbound_deliveries";
--> statement-breakpoint
DELETE FROM "commerce"."purchase_order_items";
--> statement-breakpoint
DELETE FROM "commerce"."purchase_orders";
--> statement-breakpoint
DELETE FROM "commerce"."stock_adjustment_line_items";
--> statement-breakpoint
DELETE FROM "commerce"."stock_adjustment_lines";
--> statement-breakpoint
DELETE FROM "commerce"."stock_adjustment_lots";
--> statement-breakpoint
DELETE FROM "commerce"."stock_adjustments";
--> statement-breakpoint
DELETE FROM "commerce"."stock_transfers";
--> statement-breakpoint
DELETE FROM "commerce"."inventory_item_quant_costs";
--> statement-breakpoint
DELETE FROM "commerce"."inventory_item_costs";
--> statement-breakpoint
DELETE FROM "commerce"."inventory_item_ledger";
--> statement-breakpoint
DELETE FROM "commerce"."inventory_item_serials";
--> statement-breakpoint
DELETE FROM "commerce"."inventory_item_quants";
--> statement-breakpoint
DELETE FROM "commerce"."inventory_item_lots";
