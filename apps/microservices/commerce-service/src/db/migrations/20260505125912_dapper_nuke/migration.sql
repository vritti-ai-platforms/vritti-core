CREATE TABLE "vritti_core"."inventory_item_uom_conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"uom_id" uuid NOT NULL,
	"conversion_factor" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_iiuc_item_uom" ON "vritti_core"."inventory_item_uom_conversions" ("inventory_item_id","uom_id");--> statement-breakpoint
CREATE INDEX "idx_iiuc_bu" ON "vritti_core"."inventory_item_uom_conversions" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "idx_iiuc_item" ON "vritti_core"."inventory_item_uom_conversions" ("inventory_item_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" ADD CONSTRAINT "inventory_item_uom_conversions_rzKG09lM3ksH_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" ADD CONSTRAINT "inventory_item_uom_conversions_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "vritti_core"."uom"("id") ON DELETE RESTRICT;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."inventory_item_uom_conversions" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."inventory_item_uom_conversions" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY((select current_setting('app.bu_ancestor_ids', true))::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."inventory_item_uom_conversions" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."inventory_item_uom_conversions" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."inventory_item_uom_conversions" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = (select current_setting('app.bu_id', true)::uuid));