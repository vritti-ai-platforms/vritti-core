ALTER TABLE "vritti_core"."products" DROP CONSTRAINT "products_station_id_stations_id_fkey";--> statement-breakpoint
ALTER TABLE "vritti_core"."order_items" DROP CONSTRAINT "order_items_order_id_orders_id_fkey";--> statement-breakpoint
ALTER TABLE "vritti_core"."order_items" DROP CONSTRAINT "order_items_station_id_stations_id_fkey";--> statement-breakpoint
ALTER TABLE "vritti_core"."invoices" DROP CONSTRAINT "invoices_order_id_orders_id_fkey";--> statement-breakpoint
DROP TABLE "vritti_core"."stations";--> statement-breakpoint
DROP TABLE "vritti_core"."products";--> statement-breakpoint
DROP TABLE "vritti_core"."orders";--> statement-breakpoint
DROP TABLE "vritti_core"."order_items";--> statement-breakpoint
DROP TABLE "vritti_core"."invoices";--> statement-breakpoint
CREATE INDEX "idx_categories_bu" ON "vritti_core"."categories" ("organization_id","business_unit_id");