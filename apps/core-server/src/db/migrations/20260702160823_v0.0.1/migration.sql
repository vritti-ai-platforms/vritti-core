DROP INDEX "vritti_core"."roles_org_code_unique";--> statement-breakpoint
ALTER TABLE "vritti_core"."roles" ADD COLUMN "revoked" jsonb;--> statement-breakpoint
ALTER TABLE "vritti_core"."roles" ALTER COLUMN "code" SET NOT NULL;