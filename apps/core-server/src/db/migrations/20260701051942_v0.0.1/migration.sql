ALTER TABLE "vritti_core"."org_roles" RENAME TO "roles";--> statement-breakpoint
ALTER TABLE "vritti_core"."user_role_assignments" RENAME COLUMN "org_role_id" TO "role_id";--> statement-breakpoint
ALTER INDEX "vritti_core"."org_roles_org_name_unique" RENAME TO "roles_org_name_unique";--> statement-breakpoint
ALTER TABLE "vritti_core"."roles" DROP COLUMN "scope";--> statement-breakpoint
ALTER TABLE "vritti_core"."roles" DROP COLUMN "app_codes";--> statement-breakpoint
DROP TYPE "vritti_core"."role_scope";