CREATE TYPE "vritti_core"."tax_jurisdiction_level" AS ENUM('COUNTRY', 'STATE', 'COUNTY', 'CITY', 'DISTRICT');--> statement-breakpoint
CREATE TABLE "vritti_core"."tax_jurisdictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"level" "vritti_core"."tax_jurisdiction_level" NOT NULL,
	"parent_id" uuid,
	"country_code" varchar(2) NOT NULL,
	"region_code" varchar(10),
	"tax_union" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_tax_jurisdictions_org_code" UNIQUE("organization_id","code"),
	CONSTRAINT "tax_jurisdictions_code_chk" CHECK ("code" ~ '^[a-z][a-z0-9-]*$')
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_jurisdictions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_tax_jurisdictions_org" ON "vritti_core"."tax_jurisdictions" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_tax_jurisdictions_parent" ON "vritti_core"."tax_jurisdictions" ("parent_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_jurisdictions" ADD CONSTRAINT "tax_jurisdictions_parent_id_tax_jurisdictions_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "vritti_core"."tax_jurisdictions"("id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."tax_jurisdictions" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));