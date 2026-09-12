ALTER TABLE "commerce"."offerings" DROP CONSTRAINT "offerings_sales_tax_group_id_tax_groups_id_fkey";--> statement-breakpoint
ALTER TABLE "commerce"."inventory_items" DROP CONSTRAINT "inventory_items_tax_class_id_tax_classes_id_fkey";--> statement-breakpoint
ALTER TABLE "commerce"."offering_variants" DROP CONSTRAINT "offering_variants_tax_class_id_tax_classes_id_fkey";--> statement-breakpoint
ALTER TABLE "commerce"."offerings" ADD COLUMN "tax_class_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."supplier_items" ADD COLUMN "tax_class_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "commerce"."offerings" DROP COLUMN "sales_tax_group_id";--> statement-breakpoint
ALTER TABLE "commerce"."inventory_items" DROP COLUMN "tax_class_id";--> statement-breakpoint
ALTER TABLE "commerce"."offering_variants" DROP COLUMN "tax_class_id";--> statement-breakpoint
ALTER TABLE "commerce"."offerings" ADD CONSTRAINT "offerings_tax_class_id_tax_classes_id_fkey" FOREIGN KEY ("tax_class_id") REFERENCES "commerce"."tax_classes"("id");--> statement-breakpoint
ALTER TABLE "commerce"."supplier_items" ADD CONSTRAINT "supplier_items_tax_class_id_tax_classes_id_fkey" FOREIGN KEY ("tax_class_id") REFERENCES "commerce"."tax_classes"("id");