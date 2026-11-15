-- Custom SQL migration file, put your code below! --
ALTER TYPE "commerce"."purchase_type" RENAME VALUE 'ORDER_BILL_WITH_GOODS' TO 'ORDER_INVOICE_WITH_GOODS';
--> statement-breakpoint
ALTER TYPE "commerce"."purchase_type" RENAME VALUE 'SELF_BILLING' TO 'SELF_INVOICING';
--> statement-breakpoint
ALTER TYPE "commerce"."purchase_step" RENAME VALUE 'DEMAND' TO 'ITEMS';
--> statement-breakpoint
ALTER TYPE "commerce"."purchase_leg_step" RENAME VALUE 'ORDER' TO 'PURCHASE_ORDER';
--> statement-breakpoint
ALTER TYPE "commerce"."purchase_leg_step" RENAME VALUE 'ANNOUNCE' TO 'INBOUND_DELIVERY';
--> statement-breakpoint
ALTER TYPE "commerce"."purchase_leg_step" RENAME VALUE 'RECEIVE' TO 'GOODS_RECEIPT';
--> statement-breakpoint
ALTER TYPE "commerce"."purchase_leg_step" RENAME VALUE 'RECEIVE_BILL' TO 'RECEIVE_WITH_INVOICE';
--> statement-breakpoint
ALTER TYPE "commerce"."purchase_leg_step" RENAME VALUE 'BILL' TO 'SUPPLIER_INVOICE';
--> statement-breakpoint
ALTER TYPE "commerce"."purchase_leg_step" RENAME VALUE 'APPROVE_BILL' TO 'APPROVE_INVOICE';
--> statement-breakpoint
ALTER TYPE "commerce"."inbound_delivery_source" RENAME VALUE 'RECEIPT' TO 'GOODS_RECEIPT';
--> statement-breakpoint
ALTER TYPE "commerce"."inbound_delivery_source" RENAME VALUE 'INVOICE' TO 'SUPPLIER_INVOICE';
--> statement-breakpoint
ALTER TYPE "commerce"."goods_receipt_status" RENAME VALUE 'PUBLISHED' TO 'POSTED';
--> statement-breakpoint
ALTER TYPE "commerce"."purchase_order_status" RENAME VALUE 'CLOSED' TO 'DELIVERY_COMPLETED';
--> statement-breakpoint
ALTER TYPE "commerce"."supplier_invoice_source" RENAME VALUE 'SELF_BILLED' TO 'SELF_INVOICED';
--> statement-breakpoint
ALTER TYPE "commerce"."purchase_order_billing_status" RENAME VALUE 'NOTHING_TO_BILL' TO 'NOTHING_TO_INVOICE';
--> statement-breakpoint
ALTER TYPE "commerce"."purchase_order_billing_status" RENAME VALUE 'TO_BILL' TO 'TO_INVOICE';
--> statement-breakpoint
ALTER TYPE "commerce"."purchase_order_billing_status" RENAME VALUE 'BILLED' TO 'INVOICED';
--> statement-breakpoint
ALTER TYPE "commerce"."supplier_invoice_hold_code" RENAME VALUE 'BILLED_MORE_THAN_ORDERED' TO 'INVOICED_MORE_THAN_ORDERED';
