ALTER TABLE "commerce"."offering_variants" RENAME COLUMN "sku" TO "code";--> statement-breakpoint
ALTER TABLE "commerce"."order_items" RENAME COLUMN "sku" TO "code";--> statement-breakpoint
ALTER TABLE "commerce"."offering_variants" RENAME CONSTRAINT "uq_offering_variants_org_sku" TO "uq_offering_variants_org_code";--> statement-breakpoint
ALTER TABLE "commerce"."offering_variants" ADD CONSTRAINT "offering_variants_code_chk" CHECK ("code" ~ '^[a-z0-9][a-z0-9-]*$');