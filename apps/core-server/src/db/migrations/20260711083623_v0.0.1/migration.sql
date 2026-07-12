CREATE TABLE "vritti_core"."site_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(100) NOT NULL,
	"parent_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."site_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vritti_core"."site_groups" ADD CONSTRAINT "site_groups_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "vritti_core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."site_groups" ADD CONSTRAINT "site_groups_parent_id_site_groups_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "vritti_core"."site_groups"("id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."site_groups" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));--> statement-breakpoint
ALTER TABLE "vritti_core"."business_units" RENAME TO "sites";--> statement-breakpoint
ALTER INDEX "vritti_core"."business_units_organization_id_idx" RENAME TO "sites_organization_id_idx";--> statement-breakpoint
DROP INDEX "vritti_core"."business_units_parent_id_idx";--> statement-breakpoint
DROP INDEX "vritti_core"."business_units_path_idx";--> statement-breakpoint
ALTER TABLE "vritti_core"."sites" RENAME CONSTRAINT "business_units_organization_id_organizations_id_fkey" TO "sites_organization_id_organizations_id_fkey";--> statement-breakpoint
ALTER TABLE "vritti_core"."sites" RENAME CONSTRAINT "business_units_legal_entity_id_legal_entities_id_fkey" TO "sites_legal_entity_id_legal_entities_id_fkey";--> statement-breakpoint
ALTER TABLE "vritti_core"."sites" RENAME CONSTRAINT "business_units_registration_id_le_tax_registrations_id_fkey" TO "sites_registration_id_le_tax_registrations_id_fkey";--> statement-breakpoint
ALTER TABLE "vritti_core"."sites" DROP CONSTRAINT IF EXISTS "bu_registration_outlet_only";--> statement-breakpoint
ALTER TABLE "vritti_core"."sites" ADD COLUMN "group_id" uuid;--> statement-breakpoint
INSERT INTO "vritti_core"."site_groups" ("id", "organization_id", "name", "code", "parent_id", "is_active", "created_at", "updated_at")
SELECT b."id", b."organization_id", b."name", b."code", NULL, b."is_active", b."created_at", b."updated_at"
FROM "vritti_core"."sites" b
WHERE b."type" = 'OUTLET_GROUP';--> statement-breakpoint
UPDATE "vritti_core"."site_groups" sg SET "code" = sg."code" || '-' || left(sg."id"::text, 8)
WHERE EXISTS (
	SELECT 1 FROM "vritti_core"."site_groups" o
	WHERE o."organization_id" = sg."organization_id" AND o."code" = sg."code" AND o."id" < sg."id"
);--> statement-breakpoint
UPDATE "vritti_core"."site_groups" sg SET "parent_id" = s."parent_id"
FROM "vritti_core"."sites" s
WHERE sg."id" = s."id" AND s."parent_id" IS NOT NULL
	AND EXISTS (SELECT 1 FROM "vritti_core"."sites" p WHERE p."id" = s."parent_id" AND p."type" = 'OUTLET_GROUP');--> statement-breakpoint
UPDATE "vritti_core"."sites" s SET "group_id" = s."parent_id"
WHERE s."type" <> 'OUTLET_GROUP' AND s."parent_id" IS NOT NULL
	AND EXISTS (SELECT 1 FROM "vritti_core"."site_groups" g WHERE g."id" = s."parent_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."user_role_assignments" RENAME COLUMN "business_unit_id" TO "site_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."user_role_assignments" ALTER COLUMN "site_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."user_role_assignments" DROP CONSTRAINT "user_role_assignments_business_unit_id_business_units_id_fkey";--> statement-breakpoint
DROP INDEX "vritti_core"."user_role_assignments_user_bu_unique";--> statement-breakpoint
ALTER TABLE "vritti_core"."user_role_assignments" ADD COLUMN "site_group_id" uuid;--> statement-breakpoint
ALTER TABLE "vritti_core"."user_role_assignments" ADD COLUMN "legal_entity_id" uuid;--> statement-breakpoint
UPDATE "vritti_core"."user_role_assignments" a SET "site_group_id" = a."site_id", "site_id" = NULL
WHERE EXISTS (SELECT 1 FROM "vritti_core"."site_groups" g WHERE g."id" = a."site_id");--> statement-breakpoint
DELETE FROM "vritti_core"."sites" WHERE "type" = 'OUTLET_GROUP';--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM "vritti_core"."sites" WHERE "type" = 'OUTLET_GROUP') THEN
		RAISE EXCEPTION 'Migration aborted: % sites row(s) still use bu_type OUTLET_GROUP; conversion to site_groups failed', (SELECT count(*) FROM "vritti_core"."sites" WHERE "type" = 'OUTLET_GROUP');
	END IF;
END $$;--> statement-breakpoint
CREATE TYPE "vritti_core"."site_type" AS ENUM('OUTLET', 'WAREHOUSE', 'PRODUCTION');--> statement-breakpoint
ALTER TABLE "vritti_core"."sites" ALTER COLUMN "type" SET DATA TYPE "vritti_core"."site_type" USING "type"::text::"vritti_core"."site_type";--> statement-breakpoint
DROP TYPE "vritti_core"."bu_type";--> statement-breakpoint
ALTER TABLE "vritti_core"."sites" DROP COLUMN "parent_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."sites" DROP COLUMN "path";--> statement-breakpoint
ALTER TABLE "vritti_core"."sites" DROP COLUMN "depth";--> statement-breakpoint
ALTER TABLE "vritti_core"."sites" ADD CONSTRAINT "sites_group_id_site_groups_id_fkey" FOREIGN KEY ("group_id") REFERENCES "vritti_core"."site_groups"("id") ON DELETE RESTRICT;--> statement-breakpoint
CREATE INDEX "sites_group_id_idx" ON "vritti_core"."sites" ("group_id");--> statement-breakpoint
CREATE INDEX "site_groups_organization_id_idx" ON "vritti_core"."site_groups" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "site_groups_org_code_unique" ON "vritti_core"."site_groups" ("organization_id","code");--> statement-breakpoint
ALTER TABLE "vritti_core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_site_id_sites_id_fkey" FOREIGN KEY ("site_id") REFERENCES "vritti_core"."sites"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_site_group_id_site_groups_id_fkey" FOREIGN KEY ("site_group_id") REFERENCES "vritti_core"."site_groups"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_legal_entity_id_legal_entities_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "vritti_core"."legal_entities"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_single_target" CHECK (num_nonnulls(site_id, site_group_id, legal_entity_id) <= 1);--> statement-breakpoint
ALTER TABLE "vritti_core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_target_unique" UNIQUE NULLS NOT DISTINCT("user_id","site_id","site_group_id","legal_entity_id");
