CREATE TYPE "vritti_core"."assignment_type" AS ENUM('DIRECT', 'INHERITED');--> statement-breakpoint
CREATE TYPE "vritti_core"."bu_type" AS ENUM('ORGANIZATION', 'REGION', 'FRANCHISEE', 'BRANCH', 'TEAM', 'DEPARTMENT', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "vritti_core"."role_scope" AS ENUM('GLOBAL', 'SUBTREE', 'SINGLE_BU');--> statement-breakpoint
CREATE TABLE "vritti_core"."table_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"table_slug" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"state" jsonb NOT NULL,
	"is_shared" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."business_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" varchar(255) NOT NULL,
	"code" varchar(100),
	"type" "vritti_core"."bu_type" NOT NULL,
	"depth" integer DEFAULT 0 NOT NULL,
	"path" text,
	"app_overrides" jsonb,
	"inherit_config" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."org_apps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"app_code" varchar(100) NOT NULL,
	"app_name" varchar(255) NOT NULL,
	"app_version" varchar(50),
	"config" jsonb,
	"is_addon" boolean DEFAULT false NOT NULL,
	"business_unit_id" uuid,
	"microfrontend" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."org_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"app_code" varchar(100) NOT NULL,
	"feature_code" varchar(255) NOT NULL,
	"feature_name" varchar(255) NOT NULL,
	"feature_type" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."org_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"scope" "vritti_core"."role_scope" NOT NULL,
	"source_role_id" uuid,
	"is_locked" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."org_role_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"org_role_id" uuid NOT NULL,
	"app_code" varchar(100) NOT NULL,
	"feature_code" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."user_role_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"org_role_id" uuid NOT NULL,
	"business_unit_id" uuid NOT NULL,
	"assignment_type" "vritti_core"."assignment_type" DEFAULT 'DIRECT'::"vritti_core"."assignment_type" NOT NULL,
	"granted_by" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "table_views_user_table_idx" ON "vritti_core"."table_views" ("user_id","table_slug");--> statement-breakpoint
CREATE INDEX "table_views_shared_slug_idx" ON "vritti_core"."table_views" ("table_slug","is_shared");--> statement-breakpoint
CREATE UNIQUE INDEX "table_views_user_table_name_shared_unique" ON "vritti_core"."table_views" ("user_id","table_slug","name","is_shared");--> statement-breakpoint
CREATE INDEX "business_units_organization_id_idx" ON "vritti_core"."business_units" ("organization_id");--> statement-breakpoint
CREATE INDEX "business_units_parent_id_idx" ON "vritti_core"."business_units" ("parent_id");--> statement-breakpoint
CREATE INDEX "business_units_path_idx" ON "vritti_core"."business_units" ("path");--> statement-breakpoint
CREATE INDEX "org_apps_organization_id_idx" ON "vritti_core"."org_apps" ("organization_id");--> statement-breakpoint
CREATE INDEX "org_apps_business_unit_id_idx" ON "vritti_core"."org_apps" ("business_unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_features_org_feature_code_unique" ON "vritti_core"."org_features" ("organization_id","feature_code");--> statement-breakpoint
CREATE INDEX "org_features_organization_id_idx" ON "vritti_core"."org_features" ("organization_id");--> statement-breakpoint
CREATE INDEX "org_features_app_code_idx" ON "vritti_core"."org_features" ("app_code");--> statement-breakpoint
CREATE UNIQUE INDEX "org_roles_org_name_unique" ON "vritti_core"."org_roles" ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "org_role_features_role_feature_unique" ON "vritti_core"."org_role_features" ("org_role_id","feature_code");--> statement-breakpoint
CREATE INDEX "org_role_features_org_role_id_idx" ON "vritti_core"."org_role_features" ("org_role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_role_assignments_user_role_bu_unique" ON "vritti_core"."user_role_assignments" ("user_id","org_role_id","business_unit_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."table_views" ADD CONSTRAINT "table_views_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "vritti_core"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."business_units" ADD CONSTRAINT "business_units_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "vritti_core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."org_apps" ADD CONSTRAINT "org_apps_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "vritti_core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."org_features" ADD CONSTRAINT "org_features_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "vritti_core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."org_roles" ADD CONSTRAINT "org_roles_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "vritti_core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."org_role_features" ADD CONSTRAINT "org_role_features_org_role_id_org_roles_id_fkey" FOREIGN KEY ("org_role_id") REFERENCES "vritti_core"."org_roles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "vritti_core"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_org_role_id_org_roles_id_fkey" FOREIGN KEY ("org_role_id") REFERENCES "vritti_core"."org_roles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_business_unit_id_business_units_id_fkey" FOREIGN KEY ("business_unit_id") REFERENCES "vritti_core"."business_units"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_granted_by_users_id_fkey" FOREIGN KEY ("granted_by") REFERENCES "vritti_core"."users"("id") ON DELETE SET NULL;