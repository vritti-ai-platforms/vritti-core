ALTER TABLE "commerce"."inbound_deliveries" ADD COLUMN "supplier_delivery_note_number" varchar(100);--> statement-breakpoint
ALTER TABLE "commerce"."inbound_deliveries" ADD COLUMN "supplier_delivery_note_date" date;--> statement-breakpoint
CREATE INDEX "idx_inbound_deliveries_supplier_note" ON "commerce"."inbound_deliveries" ("supplier_id","supplier_delivery_note_number");