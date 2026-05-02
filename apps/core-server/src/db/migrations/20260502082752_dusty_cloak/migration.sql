CREATE SCHEMA "vritti_core";
--> statement-breakpoint
CREATE TYPE "vritti_core"."assignment_type" AS ENUM('DIRECT', 'INHERITED');--> statement-breakpoint
CREATE TYPE "vritti_core"."bu_type" AS ENUM('ORGANIZATION', 'REGION', 'FRANCHISEE', 'BRANCH', 'TEAM', 'DEPARTMENT', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "vritti_core"."media_status" AS ENUM('pending', 'ready', 'failed', 'deleted');--> statement-breakpoint
CREATE TYPE "vritti_core"."org_plan" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "vritti_core"."org_size" AS ENUM('0-10', '10-20', '20-50', '50-100', '100-500', '500+');--> statement-breakpoint
CREATE TYPE "vritti_core"."role_scope" AS ENUM('GLOBAL', 'SUBTREE', 'SINGLE_BU');--> statement-breakpoint
CREATE TYPE "vritti_core"."session_type" AS ENUM('NEXUS', 'SET_PASSWORD', 'RESET', 'MOBILE');--> statement-breakpoint
CREATE TYPE "vritti_core"."user_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TABLE "vritti_core"."media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"original_name" varchar(255) NOT NULL,
	"mime_type" varchar(255) NOT NULL,
	"size" bigint NOT NULL,
	"checksum" varchar(128),
	"storage_key" varchar(512) NOT NULL,
	"bucket" varchar(255),
	"provider" varchar(50) NOT NULL,
	"status" "vritti_core"."media_status" DEFAULT 'pending'::"vritti_core"."media_status" NOT NULL,
	"entity_type" varchar(255) NOT NULL,
	"entity_id" varchar(255) NOT NULL,
	"uploaded_by" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"full_name" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"status" "vritti_core"."user_status" DEFAULT 'PENDING'::"vritti_core"."user_status" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"phone" varchar(20),
	"phone_country" varchar(5),
	"locale" varchar(10) DEFAULT 'en' NOT NULL,
	"timezone" varchar(50) DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"type" "vritti_core"."session_type" DEFAULT 'NEXUS'::"vritti_core"."session_type" NOT NULL,
	"access_token_hash" text NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"otp_hash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"verified_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "vritti_core"."organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"subdomain" varchar(100) NOT NULL UNIQUE,
	"size" "vritti_core"."org_size" NOT NULL,
	"logo_url" varchar(500),
	"plan" "vritti_core"."org_plan" DEFAULT 'free'::"vritti_core"."org_plan" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"code" varchar(100) NOT NULL,
	"type" "vritti_core"."bu_type" NOT NULL,
	"depth" integer DEFAULT 0 NOT NULL,
	"path" vritti_core.ltree NOT NULL,
	"app_overrides" jsonb,
	"inherit_config" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"app_codes" jsonb DEFAULT '[]' NOT NULL,
	"timezone" varchar(50) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"app_codes" jsonb DEFAULT '[]' NOT NULL,
	"features" jsonb DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE INDEX "idx_media_entity" ON "vritti_core"."media" ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_media_uploaded_by" ON "vritti_core"."media" ("uploaded_by");--> statement-breakpoint
CREATE INDEX "idx_media_status" ON "vritti_core"."media" ("status");--> statement-breakpoint
CREATE INDEX "idx_media_checksum" ON "vritti_core"."media" ("checksum");--> statement-breakpoint
CREATE INDEX "idx_media_storage_key" ON "vritti_core"."media" ("storage_key");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_org_unique" ON "vritti_core"."users" ("email","organization_id");--> statement-breakpoint
CREATE INDEX "table_views_user_table_idx" ON "vritti_core"."table_views" ("user_id","table_slug");--> statement-breakpoint
CREATE INDEX "table_views_shared_slug_idx" ON "vritti_core"."table_views" ("table_slug","is_shared");--> statement-breakpoint
CREATE UNIQUE INDEX "table_views_user_table_name_shared_unique" ON "vritti_core"."table_views" ("user_id","table_slug","name","is_shared");--> statement-breakpoint
CREATE INDEX "business_units_organization_id_idx" ON "vritti_core"."business_units" ("organization_id");--> statement-breakpoint
CREATE INDEX "business_units_parent_id_idx" ON "vritti_core"."business_units" ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_roles_org_name_unique" ON "vritti_core"."org_roles" ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "user_role_assignments_user_role_bu_unique" ON "vritti_core"."user_role_assignments" ("user_id","org_role_id","business_unit_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."users" ADD CONSTRAINT "users_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "vritti_core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "vritti_core"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."verifications" ADD CONSTRAINT "verifications_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "vritti_core"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."table_views" ADD CONSTRAINT "table_views_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "vritti_core"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."business_units" ADD CONSTRAINT "business_units_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "vritti_core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."org_roles" ADD CONSTRAINT "org_roles_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "vritti_core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "vritti_core"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_org_role_id_org_roles_id_fkey" FOREIGN KEY ("org_role_id") REFERENCES "vritti_core"."org_roles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_business_unit_id_business_units_id_fkey" FOREIGN KEY ("business_unit_id") REFERENCES "vritti_core"."business_units"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_granted_by_users_id_fkey" FOREIGN KEY ("granted_by") REFERENCES "vritti_core"."users"("id") ON DELETE SET NULL;