INSERT INTO "vritti_core"."party_social_profiles" ("organization_id", "party_id", "platform", "url")
SELECT "organization_id", "id", 'WEBSITE', "website"
FROM "vritti_core"."parties"
WHERE "website" IS NOT NULL AND btrim("website") <> '';
--> statement-breakpoint
ALTER TABLE "vritti_core"."parties" DROP COLUMN "website";