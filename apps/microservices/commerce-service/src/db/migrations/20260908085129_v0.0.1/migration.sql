ALTER TABLE "commerce"."offering_dimensions" DROP CONSTRAINT "offering_dimensions_NITGvLOyuk9l_fkey";--> statement-breakpoint
DROP INDEX "commerce"."idx_offering_dimensions_template";--> statement-breakpoint
ALTER TABLE "commerce"."offering_dimensions" DROP COLUMN "template_id";