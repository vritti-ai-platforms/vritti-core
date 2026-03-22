DROP TABLE "vritti_core"."org_apps";--> statement-breakpoint
DROP TABLE "vritti_core"."org_features";--> statement-breakpoint
DROP TABLE "vritti_core"."org_role_features";--> statement-breakpoint
ALTER TABLE "vritti_core"."org_roles" ADD COLUMN "features" jsonb DEFAULT '[]' NOT NULL;