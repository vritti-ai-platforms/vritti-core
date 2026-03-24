ALTER TABLE "vritti_core"."business_units" ADD COLUMN "app_codes" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."business_units" ADD COLUMN "feature_catalog" jsonb;--> statement-breakpoint
ALTER TABLE "vritti_core"."org_roles" ADD COLUMN "app_codes" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."organizations" DROP COLUMN "feature_catalog";