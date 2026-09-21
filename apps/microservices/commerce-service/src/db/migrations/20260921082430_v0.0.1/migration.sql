DROP POLICY "org_isolation" ON "commerce"."item_field_definitions";--> statement-breakpoint
DROP POLICY "site_read" ON "commerce"."item_field_definitions";--> statement-breakpoint
DROP POLICY "site_write" ON "commerce"."item_field_definitions";--> statement-breakpoint
DROP POLICY "site_update" ON "commerce"."item_field_definitions";--> statement-breakpoint
DROP POLICY "site_delete" ON "commerce"."item_field_definitions";--> statement-breakpoint
ALTER TABLE "commerce"."item_field_values" DROP CONSTRAINT "item_field_values_V0gaE4dkunFk_fkey";--> statement-breakpoint
DROP TABLE "commerce"."item_field_definitions";--> statement-breakpoint
DROP TABLE "commerce"."item_field_values";--> statement-breakpoint
ALTER TABLE "commerce"."offerings" DROP COLUMN "attributes";--> statement-breakpoint
ALTER TABLE "commerce"."offerings" DROP COLUMN "metadata";