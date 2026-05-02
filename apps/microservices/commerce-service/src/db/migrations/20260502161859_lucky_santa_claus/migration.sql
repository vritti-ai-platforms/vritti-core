CREATE TABLE "vritti_core"."uom_dimensions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_uom_dimensions_bu_code" UNIQUE("business_unit_id","code")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."uom_dimensions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vritti_core"."uom" ADD COLUMN "dimension_id" uuid NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_uom_dimension" ON "vritti_core"."uom" ("dimension_id");--> statement-breakpoint
CREATE INDEX "idx_uom_dimensions_bu" ON "vritti_core"."uom_dimensions" ("organization_id","business_unit_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."uom" ADD CONSTRAINT "uom_dimension_id_uom_dimensions_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "vritti_core"."uom_dimensions"("id") ON DELETE RESTRICT;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."uom_dimensions" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."uom_dimensions" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."uom_dimensions" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."uom_dimensions" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."uom_dimensions" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);