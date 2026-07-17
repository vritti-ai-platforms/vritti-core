CREATE TYPE "vritti_core"."govt_id_type" AS ENUM('PAN', 'AADHAAR', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'CIVIL_ID', 'NATIONAL_ID');--> statement-breakpoint
CREATE TYPE "vritti_core"."party_type" AS ENUM('PERSON', 'ORGANIZATION');--> statement-breakpoint
CREATE TYPE "vritti_core"."tax_registration_type" AS ENUM('GSTIN', 'VAT', 'TIN', 'PAN', 'OTHER');--> statement-breakpoint
CREATE TABLE "vritti_core"."parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"code" varchar(50) NOT NULL,
	"party_type" "vritti_core"."party_type" NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"address" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"legal_name" varchar(255),
	"jurisdiction_id" uuid,
	"website" varchar(255),
	"first_name" varchar(120),
	"last_name" varchar(120),
	"govt_id" varchar(50),
	"govt_id_type" "vritti_core"."govt_id_type",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_parties_org_code" UNIQUE("organization_id","code"),
	CONSTRAINT "parties_code_chk" CHECK ("code" ~ '^[a-z][a-z0-9-]*$')
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."parties" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."party_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"parent_party_id" uuid NOT NULL,
	"child_party_id" uuid NOT NULL,
	"job_title" varchar(100),
	"secondary_phone" varchar(20),
	"secondary_email" varchar(255),
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_party_rel_parent_child" UNIQUE("parent_party_id","child_party_id")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."party_relationships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."party_tax_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"party_id" uuid NOT NULL,
	"jurisdiction_id" uuid NOT NULL,
	"registration_number" varchar(50) NOT NULL,
	"registration_type" "vritti_core"."tax_registration_type" NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_party_tax_reg_party_juris" UNIQUE("party_id","jurisdiction_id")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."party_tax_registrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_parties_org" ON "vritti_core"."parties" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_parties_type" ON "vritti_core"."parties" ("party_type");--> statement-breakpoint
CREATE INDEX "idx_party_rel_parent" ON "vritti_core"."party_relationships" ("parent_party_id");--> statement-breakpoint
CREATE INDEX "idx_party_tax_reg_party" ON "vritti_core"."party_tax_registrations" ("party_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."parties" ADD CONSTRAINT "parties_jurisdiction_id_tax_jurisdictions_id_fkey" FOREIGN KEY ("jurisdiction_id") REFERENCES "vritti_core"."tax_jurisdictions"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."party_relationships" ADD CONSTRAINT "party_relationships_parent_party_id_parties_id_fkey" FOREIGN KEY ("parent_party_id") REFERENCES "vritti_core"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."party_relationships" ADD CONSTRAINT "party_relationships_child_party_id_parties_id_fkey" FOREIGN KEY ("child_party_id") REFERENCES "vritti_core"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."party_tax_registrations" ADD CONSTRAINT "party_tax_registrations_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "vritti_core"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."party_tax_registrations" ADD CONSTRAINT "party_tax_registrations_jurisdiction_id_tax_jurisdictions_id_fkey" FOREIGN KEY ("jurisdiction_id") REFERENCES "vritti_core"."tax_jurisdictions"("id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."parties" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."party_relationships" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."party_tax_registrations" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
DROP POLICY "org_isolation" ON "vritti_core"."contacts";--> statement-breakpoint
DROP POLICY "org_isolation" ON "vritti_core"."supplier_contacts";--> statement-breakpoint
DROP POLICY "le_read" ON "vritti_core"."supplier_contacts";--> statement-breakpoint
DROP POLICY "le_write" ON "vritti_core"."supplier_contacts";--> statement-breakpoint
DROP POLICY "le_update" ON "vritti_core"."supplier_contacts";--> statement-breakpoint
DROP POLICY "le_delete" ON "vritti_core"."supplier_contacts";--> statement-breakpoint
DROP TABLE "vritti_core"."contacts";--> statement-breakpoint
DROP TABLE "vritti_core"."supplier_contacts";--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" ADD COLUMN "party_id" uuid;--> statement-breakpoint
INSERT INTO "vritti_core"."parties" ("organization_id", "code", "party_type", "display_name", "legal_name", "email", "phone", "address", "website", "jurisdiction_id", "is_active")
	SELECT s."organization_id", 'co-' || s."code", 'ORGANIZATION', s."name", s."name", s."email", s."phone", s."address", s."website", j."id", s."is_active"
	FROM "vritti_core"."suppliers" s
	LEFT JOIN "vritti_core"."legal_entities" le ON le."id" = s."legal_entity_id"
	LEFT JOIN "vritti_core"."tax_jurisdictions" j ON j."code" = lower(le."country");--> statement-breakpoint
UPDATE "vritti_core"."suppliers" s SET "party_id" = p."id" FROM "vritti_core"."parties" p WHERE p."code" = 'co-' || s."code";--> statement-breakpoint
INSERT INTO "vritti_core"."party_tax_registrations" ("organization_id", "party_id", "jurisdiction_id", "registration_number", "registration_type", "is_primary")
	SELECT s."organization_id", s."party_id", j."id", s."tax_id", (CASE WHEN le."country" = 'IN' THEN 'GSTIN' ELSE 'VAT' END)::"vritti_core"."tax_registration_type", true
	FROM "vritti_core"."suppliers" s
	JOIN "vritti_core"."legal_entities" le ON le."id" = s."legal_entity_id"
	JOIN "vritti_core"."tax_jurisdictions" j ON j."code" = lower(le."country")
	WHERE s."tax_id" IS NOT NULL;--> statement-breakpoint
INSERT INTO "vritti_core"."parties" ("organization_id", "code", "party_type", "display_name", "first_name", "last_name", "phone", "is_active")
	SELECT s."organization_id", 'ct-' || s."code", 'PERSON', s."contact_name", split_part(s."contact_name", ' ', 1), nullif(trim(substring(s."contact_name" from position(' ' in s."contact_name") + 1)), ''), s."phone", true
	FROM "vritti_core"."suppliers" s
	WHERE s."contact_name" IS NOT NULL AND s."contact_name" <> '';--> statement-breakpoint
INSERT INTO "vritti_core"."party_relationships" ("organization_id", "parent_party_id", "child_party_id", "is_primary")
	SELECT s."organization_id", s."party_id", cp."id", true
	FROM "vritti_core"."suppliers" s
	JOIN "vritti_core"."parties" cp ON cp."code" = 'ct-' || s."code"
	WHERE s."contact_name" IS NOT NULL AND s."contact_name" <> '';--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" DROP COLUMN "contact_name";--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" DROP COLUMN "website";--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" DROP COLUMN "address";--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" DROP COLUMN "tax_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" DROP COLUMN "tax_id_type";--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" ALTER COLUMN "party_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_suppliers_party" ON "vritti_core"."suppliers" ("party_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" ADD CONSTRAINT "suppliers_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "vritti_core"."parties"("id");