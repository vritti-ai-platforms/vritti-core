CREATE TYPE "vritti_core"."party_identifier_type" AS ENUM('PAN', 'AADHAAR', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'CIVIL_ID', 'NATIONAL_ID', 'DUNS', 'LEI', 'CIN');--> statement-breakpoint
CREATE TABLE "vritti_core"."party_identifiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"party_id" uuid NOT NULL,
	"id_type" "vritti_core"."party_identifier_type" NOT NULL,
	"id_value" varchar(100) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_party_identifiers_org_type_value" UNIQUE("organization_id","id_type","id_value")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."party_identifiers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vritti_core"."parties" DROP CONSTRAINT "uq_parties_org_code";--> statement-breakpoint
ALTER TABLE "vritti_core"."parties" DROP CONSTRAINT "parties_code_chk";--> statement-breakpoint
ALTER TABLE "vritti_core"."parties" DROP COLUMN "code";--> statement-breakpoint
ALTER TABLE "vritti_core"."parties" DROP COLUMN "govt_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."parties" DROP COLUMN "govt_id_type";--> statement-breakpoint
ALTER TABLE "vritti_core"."party_tax_registrations" ADD CONSTRAINT "uq_party_tax_reg_org_number" UNIQUE("organization_id","registration_number");--> statement-breakpoint
CREATE INDEX "idx_party_identifiers_party" ON "vritti_core"."party_identifiers" ("party_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."party_identifiers" ADD CONSTRAINT "party_identifiers_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "vritti_core"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."party_identifiers" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));