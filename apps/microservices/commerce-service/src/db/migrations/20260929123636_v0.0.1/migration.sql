DROP INDEX "commerce"."idx_offering_variants_offering";--> statement-breakpoint
CREATE INDEX "idx_offering_variants_offering" ON "commerce"."offering_variants" ("offering_id","sku");