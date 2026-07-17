CREATE TABLE "vritti_core"."contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"code" varchar(50) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"legal_name" varchar(255),
	"is_business" boolean DEFAULT true NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"tax_id" varchar(50),
	"notes" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_contacts_org_code" UNIQUE("organization_id","code"),
	CONSTRAINT "contacts_code_chk" CHECK ("code" ~ '^[a-z][a-z0-9-]*$')
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_contacts_org" ON "vritti_core"."contacts" ("organization_id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."contacts" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));