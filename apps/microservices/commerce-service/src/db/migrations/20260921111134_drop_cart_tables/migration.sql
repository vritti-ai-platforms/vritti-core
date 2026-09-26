DROP POLICY "org_isolation" ON "commerce"."cart_items";--> statement-breakpoint
DROP POLICY "cart_reach" ON "commerce"."cart_items";--> statement-breakpoint
DROP POLICY "org_isolation" ON "commerce"."carts";--> statement-breakpoint
ALTER TABLE "commerce"."cart_items" DROP CONSTRAINT "cart_items_cart_id_carts_id_fkey";--> statement-breakpoint
DROP TABLE "commerce"."cart_items";--> statement-breakpoint
DROP TABLE "commerce"."carts";--> statement-breakpoint
DROP TYPE "commerce"."cart_status";