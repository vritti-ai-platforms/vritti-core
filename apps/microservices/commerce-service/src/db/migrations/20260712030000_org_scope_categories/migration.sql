DROP POLICY "site_read" ON "vritti_core"."categories";
--> statement-breakpoint
DROP POLICY "site_write" ON "vritti_core"."categories";
--> statement-breakpoint
DROP POLICY "site_update" ON "vritti_core"."categories";
--> statement-breakpoint
DROP POLICY "site_delete" ON "vritti_core"."categories";
--> statement-breakpoint
DROP INDEX "vritti_core"."idx_categories_site";
--> statement-breakpoint
ALTER TABLE "vritti_core"."categories" DROP COLUMN "site_id";
--> statement-breakpoint
CREATE INDEX "idx_categories_org" ON "vritti_core"."categories" ("organization_id");