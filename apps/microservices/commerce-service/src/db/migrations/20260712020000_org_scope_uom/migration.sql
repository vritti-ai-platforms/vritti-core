DROP POLICY "site_read" ON "vritti_core"."uom";
--> statement-breakpoint
DROP POLICY "site_write" ON "vritti_core"."uom";
--> statement-breakpoint
DROP POLICY "site_update" ON "vritti_core"."uom";
--> statement-breakpoint
DROP POLICY "site_delete" ON "vritti_core"."uom";
--> statement-breakpoint
DROP INDEX "vritti_core"."uq_uom_bu_symbol";
--> statement-breakpoint
DROP INDEX "vritti_core"."idx_uom_site";
--> statement-breakpoint
DELETE FROM "vritti_core"."uom" a
USING "vritti_core"."uom" b
WHERE a.organization_id = b.organization_id
  AND a.symbol = b.symbol
  AND (a.created_at > b.created_at OR (a.created_at = b.created_at AND a.id > b.id));
--> statement-breakpoint
ALTER TABLE "vritti_core"."uom" DROP COLUMN "site_id";
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_uom_org_symbol" ON "vritti_core"."uom" ("organization_id","symbol");
--> statement-breakpoint
CREATE INDEX "idx_uom_org" ON "vritti_core"."uom" ("organization_id");