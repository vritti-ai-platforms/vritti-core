ALTER TABLE "commerce"."offering_dimension_template_values" RENAME TO "dimension_template_values";--> statement-breakpoint
ALTER TABLE "commerce"."offering_dimension_templates" RENAME TO "dimension_templates";--> statement-breakpoint
ALTER TABLE "commerce"."dimension_template_values" RENAME CONSTRAINT "offering_dimension_template_values_code_chk" TO "dimension_template_values_code_chk";--> statement-breakpoint
ALTER TABLE "commerce"."dimension_templates" RENAME CONSTRAINT "offering_dimension_templates_code_chk" TO "dimension_templates_code_chk";--> statement-breakpoint
ALTER TABLE "commerce"."dimension_templates" RENAME CONSTRAINT "offering_dimension_templates_owner_chk" TO "dimension_templates_owner_chk";--> statement-breakpoint
ALTER INDEX "commerce"."idx_offering_dimension_template_values_template" RENAME TO "idx_dimension_template_values_template";--> statement-breakpoint
ALTER INDEX "commerce"."idx_offering_dimension_templates_org" RENAME TO "idx_dimension_templates_org";--> statement-breakpoint
ALTER INDEX "commerce"."idx_offering_dimension_templates_le" RENAME TO "idx_dimension_templates_le";--> statement-breakpoint
ALTER INDEX "commerce"."idx_offering_dimension_templates_site" RENAME TO "idx_dimension_templates_site";--> statement-breakpoint
ALTER TABLE "commerce"."dimension_template_values" RENAME CONSTRAINT "uq_offering_dimension_template_values_template_value" TO "uq_dimension_template_values_template_value";--> statement-breakpoint
ALTER TABLE "commerce"."dimension_template_values" RENAME CONSTRAINT "uq_offering_dimension_template_values_template_code" TO "uq_dimension_template_values_template_code";--> statement-breakpoint
ALTER TABLE "commerce"."dimension_templates" RENAME CONSTRAINT "uq_offering_dimension_templates_org_code" TO "uq_dimension_templates_org_code";--> statement-breakpoint
ALTER TABLE "commerce"."dimension_templates" RENAME CONSTRAINT "uq_offering_dimension_templates_owner_name" TO "uq_dimension_templates_owner_name";