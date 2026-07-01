ALTER TABLE "vritti_core"."roles" RENAME COLUMN "source_role_id" TO "code";--> statement-breakpoint
ALTER TABLE "vritti_core"."roles" ALTER COLUMN "code" SET DATA TYPE varchar(255) USING "code"::varchar(255);--> statement-breakpoint
CREATE UNIQUE INDEX "roles_org_code_unique" ON "vritti_core"."roles" ("organization_id","code");