ALTER TABLE "vritti_core"."catalog_channels" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."categories" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."credit_notes" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."customers" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_items" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_line_items" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_lines" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_lots" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipts" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_ledger" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_locations" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_lots" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_quants" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_serials" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."invoices" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."item_field_definitions" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."locations" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."modifier_groups" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."offerings" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."orders" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."pos_terminals" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_orders" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_line_items" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lines" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lots" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustments" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_contacts" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_groups" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."uom" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."uom_dimensions" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."catalog_channels" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."categories" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."credit_notes" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."customers" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_items" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_line_items" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_lines" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_lots" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipts" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_ledger" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_locations" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_lots" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_quants" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_serials" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."invoices" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."item_field_definitions" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."locations" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."modifier_groups" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."offerings" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."orders" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."pos_terminals" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_orders" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_line_items" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lines" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lots" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustments" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_contacts" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_groups" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."uom" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
ALTER TABLE "vritti_core"."uom_dimensions" ALTER COLUMN "site_id" SET DEFAULT cast(current_setting('app.site_id') as uuid);--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."catalog_channels";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."catalog_channels";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."catalog_channels";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."catalog_channels";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."categories";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."categories";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."categories";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."categories";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."credit_notes";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."credit_notes";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."credit_notes";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."credit_notes";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."customers";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."customers";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."customers";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."customers";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."goods_receipt_items";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."goods_receipt_items";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."goods_receipt_items";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."goods_receipt_items";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."goods_receipt_line_items";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."goods_receipt_line_items";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."goods_receipt_line_items";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."goods_receipt_line_items";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."goods_receipt_lines";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."goods_receipt_lines";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."goods_receipt_lines";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."goods_receipt_lines";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."goods_receipt_lots";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."goods_receipt_lots";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."goods_receipt_lots";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."goods_receipt_lots";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."goods_receipts";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."goods_receipts";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."goods_receipts";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."goods_receipts";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."inventory_item_locations";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."inventory_item_locations";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."inventory_item_locations";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."inventory_item_locations";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."inventory_item_lots";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."inventory_item_lots";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."inventory_item_lots";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."inventory_item_lots";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."inventory_item_quants";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."inventory_item_quants";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."inventory_item_quants";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."inventory_item_quants";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."inventory_item_serials";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."inventory_item_serials";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."inventory_item_serials";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."inventory_item_serials";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."inventory_item_uom_conversions";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."inventory_item_uom_conversions";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."inventory_item_uom_conversions";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."inventory_item_uom_conversions";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."inventory_items";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."inventory_items";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."inventory_items";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."inventory_items";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."invoices";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."invoices";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."invoices";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."invoices";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."item_field_definitions";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."item_field_definitions";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."item_field_definitions";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."item_field_definitions";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."locations";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."locations";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."locations";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."locations";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."modifier_groups";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."modifier_groups";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."modifier_groups";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."modifier_groups";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."offerings";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."offerings";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."offerings";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."offerings";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."orders";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."orders";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."orders";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."orders";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."pos_terminals";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."pos_terminals";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."pos_terminals";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."pos_terminals";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."purchase_orders";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."purchase_orders";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."purchase_orders";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."purchase_orders";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."stock_adjustment_line_items";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."stock_adjustment_line_items";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."stock_adjustment_line_items";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."stock_adjustment_line_items";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."stock_adjustment_lines";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."stock_adjustment_lines";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."stock_adjustment_lines";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."stock_adjustment_lines";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."stock_adjustment_lots";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."stock_adjustment_lots";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."stock_adjustment_lots";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."stock_adjustment_lots";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."stock_adjustments";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."stock_adjustments";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."stock_adjustments";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."stock_adjustments";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."supplier_contacts";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."supplier_contacts";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."supplier_contacts";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."supplier_contacts";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."suppliers";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."suppliers";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."suppliers";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."suppliers";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."tax_groups";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."tax_groups";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."tax_groups";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."tax_groups";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."uom";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."uom";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."uom";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."uom";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."uom_dimensions";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."uom_dimensions";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."uom_dimensions";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."uom_dimensions";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_catalogs_bu";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_categories_bu";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_credit_notes_bu";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_customers_bu";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_goods_receipts_bu";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_inventory_item_ledger_bu";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_iiuc_bu";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_inventory_items_bu";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_invoices_bu";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_locations_bu";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_modifier_groups_bu";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_offerings_bu";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_orders_bu";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_pos_terminals_bu";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_purchase_orders_bu";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_stock_adjustments_bu";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_stock_transfers_from_bu";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_stock_transfers_to_bu";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_suppliers_bu";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_uom_bu";--> statement-breakpoint
DROP INDEX "vritti_core"."idx_uom_dimensions_bu";--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_transfers" RENAME COLUMN "from_bu_id" TO "from_site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_transfers" RENAME COLUMN "to_bu_id" TO "to_site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."purchase_orders" ALTER COLUMN "timezone" SET DEFAULT cast(current_setting('app.site_timezone') as text);--> statement-breakpoint
DROP INDEX "vritti_core"."uq_suppliers_bu_code";--> statement-breakpoint
CREATE UNIQUE INDEX "uq_suppliers_bu_code" ON "vritti_core"."suppliers" ("site_id","code");--> statement-breakpoint
DROP INDEX "vritti_core"."tax_groups_bu_name_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "tax_groups_bu_name_unique" ON "vritti_core"."tax_groups" ("site_id","name");--> statement-breakpoint
DROP INDEX "vritti_core"."uq_uom_bu_symbol";--> statement-breakpoint
CREATE UNIQUE INDEX "uq_uom_bu_symbol" ON "vritti_core"."uom" ("site_id","symbol");--> statement-breakpoint
ALTER TABLE "vritti_core"."catalog_channels" DROP CONSTRAINT "uq_catalog_channels_bu_channel";--> statement-breakpoint
ALTER TABLE "vritti_core"."catalog_channels" ADD CONSTRAINT "uq_catalog_channels_bu_channel" UNIQUE("site_id","channel_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."credit_notes" DROP CONSTRAINT "uq_credit_notes_bu_number";--> statement-breakpoint
ALTER TABLE "vritti_core"."credit_notes" ADD CONSTRAINT "uq_credit_notes_bu_number" UNIQUE("site_id","credit_note_number");--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" DROP CONSTRAINT "uq_inventory_items_bu_code";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" ADD CONSTRAINT "uq_inventory_items_bu_code" UNIQUE("site_id","code");--> statement-breakpoint
ALTER TABLE "vritti_core"."invoices" DROP CONSTRAINT "uq_invoices_bu_number";--> statement-breakpoint
ALTER TABLE "vritti_core"."invoices" ADD CONSTRAINT "uq_invoices_bu_number" UNIQUE("site_id","invoice_number");--> statement-breakpoint
ALTER TABLE "vritti_core"."locations" DROP CONSTRAINT "uq_locations_bu_parent_code";--> statement-breakpoint
ALTER TABLE "vritti_core"."locations" ADD CONSTRAINT "uq_locations_bu_parent_code" UNIQUE("site_id","parent_id","code");--> statement-breakpoint
ALTER TABLE "vritti_core"."pos_terminals" DROP CONSTRAINT "uq_pos_terminals_bu_code";--> statement-breakpoint
ALTER TABLE "vritti_core"."pos_terminals" ADD CONSTRAINT "uq_pos_terminals_bu_code" UNIQUE("site_id","code");--> statement-breakpoint
ALTER TABLE "vritti_core"."uom_dimensions" DROP CONSTRAINT "uq_uom_dimensions_bu_code";--> statement-breakpoint
ALTER TABLE "vritti_core"."uom_dimensions" ADD CONSTRAINT "uq_uom_dimensions_bu_code" UNIQUE("site_id","code");--> statement-breakpoint
CREATE INDEX "idx_categories_site" ON "vritti_core"."categories" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_credit_notes_site" ON "vritti_core"."credit_notes" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_customers_site" ON "vritti_core"."customers" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_goods_receipts_site" ON "vritti_core"."goods_receipts" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_ledger_site" ON "vritti_core"."inventory_item_ledger" ("site_id");--> statement-breakpoint
CREATE INDEX "idx_iiuc_site" ON "vritti_core"."inventory_item_uom_conversions" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_items_site" ON "vritti_core"."inventory_items" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_site" ON "vritti_core"."invoices" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_locations_site" ON "vritti_core"."locations" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_modifier_groups_site" ON "vritti_core"."modifier_groups" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_offerings_site" ON "vritti_core"."offerings" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_orders_site" ON "vritti_core"."orders" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_pos_terminals_site" ON "vritti_core"."pos_terminals" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_site" ON "vritti_core"."purchase_orders" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustments_site" ON "vritti_core"."stock_adjustments" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_stock_transfers_from_site" ON "vritti_core"."stock_transfers" ("from_site_id");--> statement-breakpoint
CREATE INDEX "idx_stock_transfers_to_site" ON "vritti_core"."stock_transfers" ("to_site_id");--> statement-breakpoint
CREATE INDEX "idx_suppliers_site" ON "vritti_core"."suppliers" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_uom_site" ON "vritti_core"."uom" ("organization_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_uom_dimensions_site" ON "vritti_core"."uom_dimensions" ("organization_id","site_id");--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."catalog_channels" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."catalog_channels" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."catalog_channels" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."catalog_channels" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."categories" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."categories" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."categories" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."categories" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."credit_notes" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."credit_notes" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."credit_notes" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."credit_notes" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."customers" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."customers" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."customers" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."customers" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."goods_receipt_items" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."goods_receipt_items" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."goods_receipt_items" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."goods_receipt_items" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."goods_receipt_line_items" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."goods_receipt_line_items" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."goods_receipt_line_items" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."goods_receipt_line_items" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."goods_receipt_lines" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."goods_receipt_lines" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."goods_receipt_lines" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."goods_receipt_lines" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."goods_receipt_lots" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."goods_receipt_lots" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."goods_receipt_lots" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."goods_receipt_lots" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."goods_receipts" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."goods_receipts" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."goods_receipts" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."goods_receipts" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."inventory_item_locations" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."inventory_item_locations" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."inventory_item_locations" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."inventory_item_locations" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."inventory_item_lots" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."inventory_item_lots" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."inventory_item_lots" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."inventory_item_lots" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."inventory_item_quants" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."inventory_item_quants" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."inventory_item_quants" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."inventory_item_quants" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."inventory_item_serials" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."inventory_item_serials" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."inventory_item_serials" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."inventory_item_serials" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."inventory_item_uom_conversions" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."inventory_item_uom_conversions" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."inventory_item_uom_conversions" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."inventory_item_uom_conversions" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."inventory_items" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."inventory_items" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."inventory_items" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."inventory_items" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."invoices" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."invoices" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."invoices" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."invoices" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."item_field_definitions" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."item_field_definitions" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."item_field_definitions" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."item_field_definitions" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."locations" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."locations" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."locations" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."locations" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."modifier_groups" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."modifier_groups" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."modifier_groups" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."modifier_groups" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."offerings" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."offerings" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."offerings" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."offerings" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."orders" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."orders" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."orders" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."orders" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."pos_terminals" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."pos_terminals" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."pos_terminals" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."pos_terminals" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."purchase_orders" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."purchase_orders" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."purchase_orders" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."purchase_orders" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."stock_adjustment_line_items" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."stock_adjustment_line_items" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."stock_adjustment_line_items" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."stock_adjustment_line_items" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."stock_adjustment_lines" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."stock_adjustment_lines" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."stock_adjustment_lines" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."stock_adjustment_lines" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."stock_adjustment_lots" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."stock_adjustment_lots" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."stock_adjustment_lots" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."stock_adjustment_lots" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."stock_adjustments" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."stock_adjustments" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."stock_adjustments" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."stock_adjustments" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."supplier_contacts" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."supplier_contacts" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."supplier_contacts" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."supplier_contacts" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."suppliers" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."suppliers" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."suppliers" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."suppliers" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."tax_groups" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."tax_groups" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."tax_groups" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."tax_groups" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."uom" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."uom" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."uom" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."uom" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."uom_dimensions" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."uom_dimensions" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."uom_dimensions" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."uom_dimensions" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));