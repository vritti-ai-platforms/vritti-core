-- Custom SQL migration file, put your code below! --
DELETE FROM "commerce"."purchase_events";
--> statement-breakpoint
DELETE FROM "commerce"."purchase_item_allocations";
--> statement-breakpoint
DELETE FROM "commerce"."purchase_suppliers";
--> statement-breakpoint
DELETE FROM "commerce"."supplier_quotations" WHERE "purchase_id" IS NOT NULL;
--> statement-breakpoint
DELETE FROM "commerce"."purchase_items";
--> statement-breakpoint
DELETE FROM "commerce"."supplier_invoice_holds";
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
--> statement-breakpoint
DELETE FROM "commerce"."purchases";
