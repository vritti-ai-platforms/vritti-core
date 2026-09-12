ALTER TABLE "commerce"."inventory_item_mrps" DROP CONSTRAINT "uq_inventory_item_mrps_item_uom_currency";--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_lots" ADD COLUMN "mrp_currency_code" varchar(3);--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_lots" ADD COLUMN "mrp_id" uuid;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_mrps" ADD COLUMN "is_current" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_mrps" ADD CONSTRAINT "uq_inventory_item_mrps_item_uom_currency_amount" UNIQUE("inventory_item_id","uom_id","currency_code","amount");--> statement-breakpoint
CREATE INDEX "idx_inventory_item_lots_mrp" ON "commerce"."inventory_item_lots" ("mrp_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_inventory_item_mrps_current" ON "commerce"."inventory_item_mrps" ("inventory_item_id","uom_id","currency_code") WHERE "is_current";--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_lots" ADD CONSTRAINT "inventory_item_lots_mrp_id_inventory_item_mrps_id_fkey" FOREIGN KEY ("mrp_id") REFERENCES "commerce"."inventory_item_mrps"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commerce"."inventory_item_lots" ADD CONSTRAINT "ck_inventory_item_lots_mrp_currency" CHECK (("mrp" IS NULL) = ("mrp_currency_code" IS NULL));