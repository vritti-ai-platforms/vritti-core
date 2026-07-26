CREATE SCHEMA "core";
--> statement-breakpoint
CREATE TYPE "core"."assignment_type" AS ENUM('DIRECT', 'INHERITED');--> statement-breakpoint
CREATE TYPE "core"."media_status" AS ENUM('pending', 'ready', 'failed', 'deleted');--> statement-breakpoint
CREATE TYPE "core"."org_plan" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "core"."org_size" AS ENUM('0-10', '10-20', '20-50', '50-100', '100-500', '500+');--> statement-breakpoint
CREATE TYPE "core"."pick_strategy" AS ENUM('FEFO', 'FIFO', 'LIFO');--> statement-breakpoint
CREATE TYPE "core"."scope_type" AS ENUM('ORG', 'LE', 'SITE_GROUP', 'SITE');--> statement-breakpoint
CREATE TYPE "core"."session_type" AS ENUM('WEB', 'SET_PASSWORD', 'RESET', 'MOBILE');--> statement-breakpoint
CREATE TYPE "core"."site_type" AS ENUM('OUTLET', 'WAREHOUSE', 'PRODUCTION');--> statement-breakpoint
CREATE TYPE "core"."tax_regime" AS ENUM('GST', 'VAT', 'SALES_TAX', 'NONE');--> statement-breakpoint
CREATE TYPE "core"."user_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TABLE "core"."media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"original_name" varchar(255) NOT NULL,
	"mime_type" varchar(255) NOT NULL,
	"size" bigint NOT NULL,
	"checksum" varchar(128),
	"storage_key" varchar(512) NOT NULL,
	"bucket" varchar(255),
	"provider" varchar(50) NOT NULL,
	"status" "core"."media_status" DEFAULT 'pending'::"core"."media_status" NOT NULL,
	"entity_type" varchar(255) NOT NULL,
	"entity_id" varchar(255) NOT NULL,
	"uploaded_by" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "core"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"full_name" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"status" "core"."user_status" DEFAULT 'PENDING'::"core"."user_status" NOT NULL,
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
CREATE TABLE "core"."sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"type" "core"."session_type" DEFAULT 'WEB'::"core"."session_type" NOT NULL,
	"access_token_hash" text NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."verifications" (
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
CREATE TABLE "core"."organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"subdomain" varchar(100) NOT NULL UNIQUE,
	"size" "core"."org_size" NOT NULL,
	"logo_url" varchar(500),
	"plan" "core"."org_plan" DEFAULT 'free'::"core"."org_plan" NOT NULL,
	"plan_code" varchar(100),
	"business_code" varchar(100),
	"entitlement" jsonb,
	"feature_locks" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."catalogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"version" varchar(50) NOT NULL,
	"hash" varchar(64) NOT NULL,
	"license" jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"activated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "core"."table_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"table_slug" varchar(200) NOT NULL,
	"name" varchar(100) NOT NULL,
	"state" jsonb NOT NULL,
	"is_shared" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "core"."legal_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"country" char(2) NOT NULL,
	"currency_code" char(3) NOT NULL,
	"tax_regime" "core"."tax_regime" NOT NULL,
	"tax_id" varchar(50),
	"fiscal_year_start" integer DEFAULT 4 NOT NULL,
	"parent_id" uuid,
	"feature_locks" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "core"."legal_entities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "core"."le_tax_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"legal_entity_id" uuid NOT NULL,
	"tax_number" varchar(50) NOT NULL,
	"region" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "core"."le_tax_registrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "core"."site_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(100) NOT NULL,
	"color" varchar(20),
	"parent_id" uuid,
	"feature_locks" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "core"."site_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "core"."sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(100) NOT NULL,
	"type" "core"."site_type" NOT NULL,
	"group_id" uuid,
	"app_overrides" jsonb,
	"inherit_config" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"feature_locks" jsonb,
	"timezone" varchar(50) NOT NULL,
	"legal_entity_id" uuid NOT NULL,
	"registration_id" uuid,
	"pick_strategy" "core"."pick_strategy" DEFAULT 'FEFO'::"core"."pick_strategy" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sites_code_chk" CHECK ("code" ~ '^[a-z][a-z0-9-]*$')
);
--> statement-breakpoint
ALTER TABLE "core"."sites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "core"."roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"code" varchar(255) NOT NULL,
	"scope" "core"."scope_type" DEFAULT 'ORG'::"core"."scope_type" NOT NULL,
	"site_type" "core"."site_type",
	"features" jsonb DEFAULT '{}' NOT NULL,
	"revoked" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."user_role_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"site_id" uuid,
	"site_group_id" uuid,
	"legal_entity_id" uuid,
	"assignment_type" "core"."assignment_type" DEFAULT 'DIRECT'::"core"."assignment_type" NOT NULL,
	"granted_by" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_role_assignments_user_target_unique" UNIQUE NULLS NOT DISTINCT("user_id","site_id","site_group_id","legal_entity_id"),
	CONSTRAINT "user_role_assignments_single_target" CHECK (num_nonnulls(site_id, site_group_id, legal_entity_id) <= 1)
);
--> statement-breakpoint
CREATE INDEX "idx_media_entity" ON "core"."media" ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_media_uploaded_by" ON "core"."media" ("uploaded_by");--> statement-breakpoint
CREATE INDEX "idx_media_status" ON "core"."media" ("status");--> statement-breakpoint
CREATE INDEX "idx_media_checksum" ON "core"."media" ("checksum");--> statement-breakpoint
CREATE INDEX "idx_media_storage_key" ON "core"."media" ("storage_key");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_org_unique" ON "core"."users" ("email","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "catalogs_hash_unique" ON "core"."catalogs" ("hash");--> statement-breakpoint
CREATE UNIQUE INDEX "catalogs_active_unique" ON "core"."catalogs" ("is_active") WHERE "is_active";--> statement-breakpoint
CREATE INDEX "table_views_user_table_idx" ON "core"."table_views" ("user_id","table_slug");--> statement-breakpoint
CREATE INDEX "table_views_shared_slug_idx" ON "core"."table_views" ("table_slug","is_shared");--> statement-breakpoint
CREATE UNIQUE INDEX "table_views_user_table_name_shared_unique" ON "core"."table_views" ("user_id","table_slug","name","is_shared");--> statement-breakpoint
CREATE INDEX "legal_entities_organization_id_idx" ON "core"."legal_entities" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "legal_entities_org_code_unique" ON "core"."legal_entities" ("organization_id","code");--> statement-breakpoint
CREATE INDEX "le_tax_registrations_organization_id_idx" ON "core"."le_tax_registrations" ("organization_id");--> statement-breakpoint
CREATE INDEX "le_tax_registrations_legal_entity_id_idx" ON "core"."le_tax_registrations" ("legal_entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "le_tax_registrations_le_tax_number_unique" ON "core"."le_tax_registrations" ("legal_entity_id","tax_number");--> statement-breakpoint
CREATE INDEX "site_groups_organization_id_idx" ON "core"."site_groups" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "site_groups_org_code_unique" ON "core"."site_groups" ("organization_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "sites_org_code_unique" ON "core"."sites" ("organization_id","code");--> statement-breakpoint
CREATE INDEX "sites_organization_id_idx" ON "core"."sites" ("organization_id");--> statement-breakpoint
CREATE INDEX "sites_group_id_idx" ON "core"."sites" ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_org_name_unique" ON "core"."roles" ("organization_id","name");--> statement-breakpoint
ALTER TABLE "core"."users" ADD CONSTRAINT "users_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."verifications" ADD CONSTRAINT "verifications_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."table_views" ADD CONSTRAINT "table_views_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."legal_entities" ADD CONSTRAINT "legal_entities_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."legal_entities" ADD CONSTRAINT "legal_entities_parent_id_legal_entities_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "core"."legal_entities"("id");--> statement-breakpoint
ALTER TABLE "core"."le_tax_registrations" ADD CONSTRAINT "le_tax_registrations_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."le_tax_registrations" ADD CONSTRAINT "le_tax_registrations_legal_entity_id_legal_entities_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "core"."legal_entities"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."site_groups" ADD CONSTRAINT "site_groups_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."site_groups" ADD CONSTRAINT "site_groups_parent_id_site_groups_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "core"."site_groups"("id");--> statement-breakpoint
ALTER TABLE "core"."sites" ADD CONSTRAINT "sites_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."sites" ADD CONSTRAINT "sites_group_id_site_groups_id_fkey" FOREIGN KEY ("group_id") REFERENCES "core"."site_groups"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "core"."sites" ADD CONSTRAINT "sites_legal_entity_id_legal_entities_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "core"."legal_entities"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "core"."sites" ADD CONSTRAINT "sites_registration_id_le_tax_registrations_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "core"."le_tax_registrations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "core"."roles" ADD CONSTRAINT "roles_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "core"."roles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_site_id_sites_id_fkey" FOREIGN KEY ("site_id") REFERENCES "core"."sites"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_site_group_id_site_groups_id_fkey" FOREIGN KEY ("site_group_id") REFERENCES "core"."site_groups"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_legal_entity_id_legal_entities_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "core"."legal_entities"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_granted_by_users_id_fkey" FOREIGN KEY ("granted_by") REFERENCES "core"."users"("id") ON DELETE SET NULL;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."legal_entities" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."le_tax_registrations" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."site_groups" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."sites" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));