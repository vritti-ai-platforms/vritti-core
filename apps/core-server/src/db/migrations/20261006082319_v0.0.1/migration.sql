CREATE TABLE "core"."bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"legal_entity_id" uuid NOT NULL,
	"label" varchar(100),
	"account_holder_name" varchar(255) NOT NULL,
	"account_number" varchar(50) NOT NULL,
	"ifsc_code" varchar(11) NOT NULL,
	"bank_name" varchar(255) NOT NULL,
	"branch_name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "core"."bank_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_bank_accounts_le_number" ON "core"."bank_accounts" ("legal_entity_id","account_number","ifsc_code");--> statement-breakpoint
CREATE INDEX "idx_bank_accounts_le" ON "core"."bank_accounts" ("legal_entity_id");--> statement-breakpoint
ALTER TABLE "core"."bank_accounts" ADD CONSTRAINT "bank_accounts_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."bank_accounts" ADD CONSTRAINT "bank_accounts_legal_entity_id_legal_entities_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "core"."legal_entities"("id") ON DELETE RESTRICT;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."bank_accounts" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));