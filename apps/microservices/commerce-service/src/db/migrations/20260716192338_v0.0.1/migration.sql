CREATE TYPE "vritti_core"."tax_authority_level" AS ENUM('FEDERAL', 'STATE', 'COUNTY', 'CITY', 'SPECIAL');--> statement-breakpoint
CREATE TABLE "vritti_core"."tax_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"authority_level" "vritti_core"."tax_authority_level" NOT NULL,
	"is_recoverable" boolean DEFAULT true NOT NULL,
	"is_withholding" boolean DEFAULT false NOT NULL,
	"gl_account_key" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_tax_components_org_code" UNIQUE("organization_id","code"),
	CONSTRAINT "tax_components_code_chk" CHECK ("code" ~ '^[a-z][a-z0-9-]*$')
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."tax_components" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_tax_components_org" ON "vritti_core"."tax_components" ("organization_id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."tax_components" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));