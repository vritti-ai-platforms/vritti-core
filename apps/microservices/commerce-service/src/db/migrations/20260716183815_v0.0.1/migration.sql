ALTER TABLE "vritti_core"."categories" DROP CONSTRAINT "categories_default_tax_group_id_tax_groups_id_fkey";--> statement-breakpoint
ALTER TABLE "vritti_core"."categories" DROP COLUMN "default_tax_group_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."categories" ADD COLUMN "default_tax_class_id" uuid;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" ADD COLUMN "tax_class_id" uuid;--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_variants" ADD COLUMN "tax_class_id" uuid;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" ADD CONSTRAINT "inventory_items_tax_class_id_tax_classes_id_fkey" FOREIGN KEY ("tax_class_id") REFERENCES "vritti_core"."tax_classes"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."offering_variants" ADD CONSTRAINT "offering_variants_tax_class_id_tax_classes_id_fkey" FOREIGN KEY ("tax_class_id") REFERENCES "vritti_core"."tax_classes"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."categories" ADD CONSTRAINT "categories_default_tax_class_id_tax_classes_id_fkey" FOREIGN KEY ("default_tax_class_id") REFERENCES "vritti_core"."tax_classes"("id");