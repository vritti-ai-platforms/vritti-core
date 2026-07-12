DROP POLICY "site_read" ON "vritti_core"."uom_dimensions";
--> statement-breakpoint
DROP POLICY "site_write" ON "vritti_core"."uom_dimensions";
--> statement-breakpoint
DROP POLICY "site_update" ON "vritti_core"."uom_dimensions";
--> statement-breakpoint
DROP POLICY "site_delete" ON "vritti_core"."uom_dimensions";
--> statement-breakpoint
ALTER TABLE "vritti_core"."uom_dimensions" DROP CONSTRAINT "uq_uom_dimensions_bu_code";
--> statement-breakpoint
DROP INDEX "vritti_core"."idx_uom_dimensions_site";
--> statement-breakpoint
DELETE FROM "vritti_core"."uom_dimensions" a
USING "vritti_core"."uom_dimensions" b
WHERE a.organization_id = b.organization_id
  AND a.code = b.code
  AND (a.created_at > b.created_at OR (a.created_at = b.created_at AND a.id > b.id));
--> statement-breakpoint
ALTER TABLE "vritti_core"."uom_dimensions" DROP COLUMN "site_id";
--> statement-breakpoint
ALTER TABLE "vritti_core"."uom_dimensions" ADD CONSTRAINT "uq_uom_dimensions_org_code" UNIQUE ("organization_id", "code");
--> statement-breakpoint
CREATE INDEX "idx_uom_dimensions_org" ON "vritti_core"."uom_dimensions" ("organization_id");
