ALTER TABLE "vritti_core"."categories" ADD COLUMN "default_tax_group_id" uuid;--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_groups" DROP COLUMN "is_default";--> statement-breakpoint
ALTER TABLE "vritti_core"."categories" ADD CONSTRAINT "categories_default_tax_group_id_tax_groups_id_fkey" FOREIGN KEY ("default_tax_group_id") REFERENCES "vritti_core"."tax_groups"("id") ON DELETE SET NULL;