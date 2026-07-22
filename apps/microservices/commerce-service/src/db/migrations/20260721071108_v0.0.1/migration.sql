CREATE TYPE "vritti_core"."party_function_type" AS ENUM('REGISTERED', 'BILLING', 'SHIPPING', 'ORDERING', 'COMMUNICATION', 'ORDER', 'ACCOUNTS', 'LOGISTICS', 'ESCALATION');--> statement-breakpoint
ALTER TABLE "vritti_core"."party_addresses" ADD CONSTRAINT "uq_party_addresses_party_id" UNIQUE("party_id","id");--> statement-breakpoint
ALTER TABLE "vritti_core"."party_contacts" ADD CONSTRAINT "uq_party_contacts_party_id" UNIQUE("party_id","id");--> statement-breakpoint
CREATE TABLE "vritti_core"."party_functions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"party_id" uuid NOT NULL,
	"function" "vritti_core"."party_function_type" NOT NULL,
	"party_address_id" uuid,
	"party_contact_id" uuid,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "party_functions_target_chk" CHECK (("function" IN ('REGISTERED','BILLING','SHIPPING','ORDERING') AND party_address_id IS NOT NULL AND party_contact_id IS NULL) OR ("function" IN ('COMMUNICATION','ORDER','ACCOUNTS','LOGISTICS','ESCALATION') AND party_contact_id IS NOT NULL AND party_address_id IS NULL))
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."party_functions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_party_functions_primary" ON "vritti_core"."party_functions" ("party_id","function") WHERE is_primary = true;--> statement-breakpoint
CREATE INDEX "idx_party_functions_party_function" ON "vritti_core"."party_functions" ("party_id","function");--> statement-breakpoint
ALTER TABLE "vritti_core"."party_functions" ADD CONSTRAINT "party_functions_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "vritti_core"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."party_functions" ADD CONSTRAINT "fk_party_functions_address" FOREIGN KEY ("party_id","party_address_id") REFERENCES "vritti_core"."party_addresses"("party_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."party_functions" ADD CONSTRAINT "fk_party_functions_contact" FOREIGN KEY ("party_id","party_contact_id") REFERENCES "vritti_core"."party_contacts"("party_id","id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."party_functions" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
INSERT INTO "vritti_core"."party_functions" ("organization_id", "party_id", "function", "party_contact_id", "is_primary")
	SELECT "organization_id", "party_id", "purpose"::text::"vritti_core"."party_function_type", "id", "is_primary"
	FROM "vritti_core"."party_contacts";--> statement-breakpoint
DROP INDEX "vritti_core"."uq_party_contacts_primary";--> statement-breakpoint
ALTER TABLE "vritti_core"."party_contacts" DROP COLUMN "purpose";--> statement-breakpoint
ALTER TABLE "vritti_core"."party_contacts" DROP COLUMN "is_primary";--> statement-breakpoint
WITH "seeded" AS (
	INSERT INTO "vritti_core"."party_contacts" ("organization_id", "party_id", "email", "phone")
	SELECT "organization_id", "id", "email", "phone"
	FROM "vritti_core"."parties"
	WHERE "email" IS NOT NULL OR "phone" IS NOT NULL
	RETURNING "id", "party_id", "organization_id"
)
INSERT INTO "vritti_core"."party_functions" ("organization_id", "party_id", "function", "party_contact_id", "is_primary")
	SELECT "organization_id", "party_id", 'COMMUNICATION', "id", true
	FROM "seeded";--> statement-breakpoint
ALTER TABLE "vritti_core"."parties" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "vritti_core"."parties" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "vritti_core"."party_relationships" DROP COLUMN "secondary_phone";--> statement-breakpoint
ALTER TABLE "vritti_core"."party_relationships" DROP COLUMN "secondary_email";--> statement-breakpoint
DROP TYPE "vritti_core"."party_contact_purpose";
