CREATE TABLE "vritti_core"."tax_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_tax_classes_org_code" UNIQUE("organization_id","code"),
	CONSTRAINT "tax_classes_code_chk" CHECK ("code" ~ '^[a-z][a-z0-9-]*$')
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_classes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vritti_core"."uom_dimensions" DROP CONSTRAINT "uom_dimensions_code_lowercase_chk";--> statement-breakpoint
CREATE INDEX "idx_tax_classes_org" ON "vritti_core"."tax_classes" ("organization_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" ADD CONSTRAINT "inventory_items_code_chk" CHECK ("code" ~ '^[a-z][a-z0-9-]*$');--> statement-breakpoint
ALTER TABLE "vritti_core"."uom_dimensions" ADD CONSTRAINT "uom_dimensions_code_chk" CHECK ("code" ~ '^[a-z][a-z0-9-]*$');--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."tax_classes" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));