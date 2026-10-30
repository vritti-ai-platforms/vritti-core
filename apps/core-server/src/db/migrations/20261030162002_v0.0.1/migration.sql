CREATE SCHEMA "core";
--> statement-breakpoint
CREATE TYPE "core"."app_type" AS ENUM('GRAPHQL', 'HTTP');--> statement-breakpoint
CREATE TYPE "core"."assignment_type" AS ENUM('DIRECT', 'INHERITED');--> statement-breakpoint
CREATE TYPE "core"."media_status" AS ENUM('pending', 'ready', 'failed', 'deleted');--> statement-breakpoint
CREATE TYPE "core"."org_plan" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "core"."org_size" AS ENUM('0-10', '10-20', '20-50', '50-100', '100-500', '500+');--> statement-breakpoint
CREATE TYPE "core"."payment_channel" AS ENUM('APP', 'POS', 'B2B');--> statement-breakpoint
CREATE TYPE "core"."payment_gateway_config_kind" AS ENUM('PLATFORM', 'ORG');--> statement-breakpoint
CREATE TYPE "core"."pick_strategy" AS ENUM('FEFO', 'FIFO', 'LIFO');--> statement-breakpoint
CREATE TYPE "core"."scope_type" AS ENUM('ORG', 'LE', 'SITE_GROUP', 'SITE');--> statement-breakpoint
CREATE TYPE "core"."service_type" AS ENUM('GITEA');--> statement-breakpoint
CREATE TYPE "core"."session_type" AS ENUM('WEB', 'SET_PASSWORD', 'RESET', 'MOBILE');--> statement-breakpoint
CREATE TYPE "core"."site_type" AS ENUM('OUTLET', 'WAREHOUSE', 'PRODUCTION');--> statement-breakpoint
CREATE TYPE "core"."tax_regime" AS ENUM('GST', 'VAT', 'SALES_TAX', 'NONE');--> statement-breakpoint
CREATE TYPE "core"."user_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "core"."webhook_delivery_status" AS ENUM('PENDING', 'DELIVERED', 'FAILED');--> statement-breakpoint
CREATE TABLE "core"."media" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
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
ALTER TABLE "core"."media" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "core"."users" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"full_name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"status" "core"."user_status" DEFAULT 'PENDING'::"core"."user_status" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"phone" varchar(20),
	"phone_country" varchar(5),
	"locale" varchar(10) NOT NULL,
	"timezone" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "core"."sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
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
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
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
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" varchar(255) NOT NULL,
	"subdomain" varchar(100) NOT NULL UNIQUE,
	"size" "core"."org_size" NOT NULL,
	"logo_light_url" varchar(500),
	"logo_dark_url" varchar(500),
	"plan" "core"."org_plan" DEFAULT 'free'::"core"."org_plan" NOT NULL,
	"plan_code" varchar(100),
	"business_code" varchar(100),
	"entitlement" jsonb,
	"feature_locks" jsonb,
	"storage" jsonb NOT NULL,
	"storage_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."apps" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"client_id" varchar(64) NOT NULL,
	"name" varchar(120) NOT NULL,
	"type" "core"."app_type" NOT NULL,
	"permissions" jsonb DEFAULT '{}' NOT NULL,
	"whatsapp_otp_config" jsonb,
	"sms_otp_config" jsonb,
	"base_url" varchar(2000),
	"allowed_origins" text[] DEFAULT '{}'::text[] NOT NULL,
	"signing_key" text NOT NULL,
	"signing_public_key" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."org_services" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"service" "core"."service_type" NOT NULL,
	"external_id" varchar(255),
	"external_name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "core"."org_services" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "core"."gitea_credentials" (
	"id" integer PRIMARY KEY DEFAULT 1,
	"base_url" text,
	"core_token" text,
	"pull_token" text,
	"rotated_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "gitea_credentials_singleton" CHECK ("id" = 1)
);
--> statement-breakpoint
CREATE TABLE "core"."catalogs" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"version" varchar(50) NOT NULL,
	"hash" varchar(64) NOT NULL,
	"license" jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"activated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "core"."table_views" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
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
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
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
CREATE TABLE "core"."site_groups" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
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
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
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
	"registration_number" varchar(50),
	"jurisdiction_id" uuid,
	"pick_strategy" "core"."pick_strategy" DEFAULT 'FEFO'::"core"."pick_strategy" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sites_code_chk" CHECK ("code" ~ '^[a-z0-9][a-z0-9-]*$')
);
--> statement-breakpoint
ALTER TABLE "core"."sites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "core"."bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"legal_entity_id" uuid NOT NULL,
	"account_holder_name" varchar(255) NOT NULL,
	"account_number" varchar(50) NOT NULL,
	"ifsc_code" varchar(11) NOT NULL,
	"bank_name" varchar(255) NOT NULL,
	"branch_name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_bank_accounts_id_le" UNIQUE("id","legal_entity_id")
);
--> statement-breakpoint
ALTER TABLE "core"."bank_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "core"."payment_gateway_configs" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid,
	"kind" "core"."payment_gateway_config_kind" NOT NULL,
	"gateway_code" varchar(100) NOT NULL,
	"key_id" varchar(255) NOT NULL,
	"credentials" text NOT NULL,
	"webhook_secret" text,
	"gateway_account_id" varchar(100) NOT NULL,
	"platform_fee_bps" integer DEFAULT 0 NOT NULL,
	"logo_light_url" varchar(1000),
	"logo_dark_url" varchar(1000),
	"verified_at" timestamp,
	"webhook_verified_at" timestamp,
	"last_webhook_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_payment_gateway_configs_org_gateway" UNIQUE NULLS NOT DISTINCT("organization_id","gateway_code"),
	CONSTRAINT "uq_payment_gateway_configs_id_gateway" UNIQUE("id","gateway_code"),
	CONSTRAINT "payment_gateway_configs_gateway_code_chk" CHECK ("gateway_code" ~ '^[a-z0-9][a-z0-9-]*$'),
	CONSTRAINT "payment_gateway_configs_kind_org_chk" CHECK (("kind" = 'PLATFORM' AND "organization_id" IS NULL) OR ("kind" = 'ORG' AND "organization_id" IS NOT NULL)),
	CONSTRAINT "payment_gateway_configs_fee_bps_chk" CHECK ("platform_fee_bps" >= 0 AND "platform_fee_bps" <= 10000)
);
--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "core"."payout_accounts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"legal_entity_id" uuid NOT NULL,
	"payment_gateway_config_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"gateway_code" varchar(100) NOT NULL,
	"gateway_account_id" varchar(100) NOT NULL,
	"is_main_account" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_payout_accounts_bank_gateway" UNIQUE("bank_account_id","gateway_code"),
	CONSTRAINT "uq_payout_accounts_id_le" UNIQUE("id","legal_entity_id"),
	CONSTRAINT "uq_payout_accounts_id_bank" UNIQUE("id","bank_account_id"),
	CONSTRAINT "uq_payout_accounts_config_account" UNIQUE("payment_gateway_config_id","gateway_account_id")
);
--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "core"."payout_channels" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"legal_entity_id" uuid NOT NULL,
	"site_id" uuid,
	"app_id" uuid,
	"channel" "core"."payment_channel",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_payout_channels_id_bank" UNIQUE("id","bank_account_id"),
	CONSTRAINT "uq_payout_channels_scope" UNIQUE NULLS NOT DISTINCT("legal_entity_id","site_id","app_id","channel"),
	CONSTRAINT "payout_channels_app_channel_chk" CHECK ("app_id" IS NULL OR "channel" = 'APP')
);
--> statement-breakpoint
ALTER TABLE "core"."payout_channels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "core"."payout_channel_accounts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"payout_channel_id" uuid NOT NULL,
	"payout_account_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_payout_channel_accounts_channel_account" UNIQUE("payout_channel_id","payout_account_id")
);
--> statement-breakpoint
ALTER TABLE "core"."payout_channel_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "core"."app_webhook_endpoints" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"app_id" uuid NOT NULL CONSTRAINT "uq_app_webhook_endpoints_app" UNIQUE,
	"url" varchar(2000) NOT NULL,
	"events" text[] DEFAULT ARRAY['payment_intent.succeeded', 'payment_intent.payment_failed', 'payment_intent.expired']::text[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "core"."app_webhook_endpoints" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "core"."webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"app_id" uuid NOT NULL,
	"endpoint_id" uuid NOT NULL,
	"event_id" varchar(100) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "core"."webhook_delivery_status" DEFAULT 'PENDING'::"core"."webhook_delivery_status" NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_status_code" integer,
	"last_error" text,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_webhook_deliveries_endpoint_event" UNIQUE("endpoint_id","event_id")
);
--> statement-breakpoint
ALTER TABLE "core"."webhook_deliveries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "core"."roles" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
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
ALTER TABLE "core"."roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "core"."user_role_assignments" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
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
CREATE INDEX "media_organization_id_idx" ON "core"."media" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_media_entity" ON "core"."media" ("organization_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_media_uploaded_by" ON "core"."media" ("uploaded_by");--> statement-breakpoint
CREATE INDEX "idx_media_status" ON "core"."media" ("status");--> statement-breakpoint
CREATE INDEX "idx_media_checksum" ON "core"."media" ("organization_id","checksum");--> statement-breakpoint
CREATE INDEX "idx_media_storage_key" ON "core"."media" ("organization_id","storage_key");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_org_unique" ON "core"."users" ("email","organization_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_access_token_hash" ON "core"."sessions" ("access_token_hash");--> statement-breakpoint
CREATE INDEX "idx_sessions_refresh_token_hash" ON "core"."sessions" ("refresh_token_hash");--> statement-breakpoint
CREATE INDEX "idx_sessions_user" ON "core"."sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_expires_at" ON "core"."sessions" ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "apps_client_id_unique" ON "core"."apps" ("client_id");--> statement-breakpoint
CREATE INDEX "idx_apps_org" ON "core"."apps" ("organization_id");--> statement-breakpoint
CREATE INDEX "org_services_organization_id_idx" ON "core"."org_services" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_services_org_service_unique" ON "core"."org_services" ("organization_id","service");--> statement-breakpoint
CREATE UNIQUE INDEX "catalogs_hash_unique" ON "core"."catalogs" ("hash");--> statement-breakpoint
CREATE UNIQUE INDEX "catalogs_active_unique" ON "core"."catalogs" ("is_active") WHERE "is_active";--> statement-breakpoint
CREATE INDEX "table_views_user_table_idx" ON "core"."table_views" ("user_id","table_slug");--> statement-breakpoint
CREATE INDEX "table_views_shared_slug_idx" ON "core"."table_views" ("table_slug","is_shared");--> statement-breakpoint
CREATE UNIQUE INDEX "table_views_user_table_name_shared_unique" ON "core"."table_views" ("user_id","table_slug","name","is_shared");--> statement-breakpoint
CREATE INDEX "legal_entities_organization_id_idx" ON "core"."legal_entities" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "legal_entities_org_code_unique" ON "core"."legal_entities" ("organization_id","code");--> statement-breakpoint
CREATE INDEX "site_groups_organization_id_idx" ON "core"."site_groups" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "site_groups_org_code_unique" ON "core"."site_groups" ("organization_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "sites_org_code_unique" ON "core"."sites" ("organization_id","code");--> statement-breakpoint
CREATE INDEX "sites_organization_id_idx" ON "core"."sites" ("organization_id");--> statement-breakpoint
CREATE INDEX "sites_group_id_idx" ON "core"."sites" ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_bank_accounts_le_number" ON "core"."bank_accounts" ("legal_entity_id","account_number","ifsc_code");--> statement-breakpoint
CREATE INDEX "idx_bank_accounts_le" ON "core"."bank_accounts" ("legal_entity_id");--> statement-breakpoint
CREATE INDEX "idx_payout_accounts_le" ON "core"."payout_accounts" ("legal_entity_id");--> statement-breakpoint
CREATE INDEX "idx_payout_accounts_config" ON "core"."payout_accounts" ("payment_gateway_config_id");--> statement-breakpoint
CREATE INDEX "idx_payout_accounts_bank_account" ON "core"."payout_accounts" ("bank_account_id");--> statement-breakpoint
CREATE INDEX "idx_payout_channels_le" ON "core"."payout_channels" ("legal_entity_id");--> statement-breakpoint
CREATE INDEX "idx_payout_channels_bank_account" ON "core"."payout_channels" ("bank_account_id");--> statement-breakpoint
CREATE INDEX "idx_payout_channel_accounts_account" ON "core"."payout_channel_accounts" ("payout_account_id");--> statement-breakpoint
CREATE INDEX "idx_app_webhook_endpoints_org" ON "core"."app_webhook_endpoints" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_deliveries_status_next_attempt" ON "core"."webhook_deliveries" ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "idx_webhook_deliveries_app" ON "core"."webhook_deliveries" ("app_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_org_name_unique" ON "core"."roles" ("organization_id","name");--> statement-breakpoint
ALTER TABLE "core"."media" ADD CONSTRAINT "media_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."users" ADD CONSTRAINT "users_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."verifications" ADD CONSTRAINT "verifications_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."apps" ADD CONSTRAINT "apps_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."org_services" ADD CONSTRAINT "org_services_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."table_views" ADD CONSTRAINT "table_views_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."legal_entities" ADD CONSTRAINT "legal_entities_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."legal_entities" ADD CONSTRAINT "legal_entities_parent_id_legal_entities_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "core"."legal_entities"("id");--> statement-breakpoint
ALTER TABLE "core"."site_groups" ADD CONSTRAINT "site_groups_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."site_groups" ADD CONSTRAINT "site_groups_parent_id_site_groups_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "core"."site_groups"("id");--> statement-breakpoint
ALTER TABLE "core"."sites" ADD CONSTRAINT "sites_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."sites" ADD CONSTRAINT "sites_group_id_site_groups_id_fkey" FOREIGN KEY ("group_id") REFERENCES "core"."site_groups"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "core"."sites" ADD CONSTRAINT "sites_legal_entity_id_legal_entities_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "core"."legal_entities"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "core"."bank_accounts" ADD CONSTRAINT "bank_accounts_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."bank_accounts" ADD CONSTRAINT "bank_accounts_legal_entity_id_legal_entities_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "core"."legal_entities"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ADD CONSTRAINT "payment_gateway_configs_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" ADD CONSTRAINT "payout_accounts_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" ADD CONSTRAINT "payout_accounts_legal_entity_id_legal_entities_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "core"."legal_entities"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" ADD CONSTRAINT "payout_accounts_bank_account_le_fkey" FOREIGN KEY ("bank_account_id","legal_entity_id") REFERENCES "core"."bank_accounts"("id","legal_entity_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "core"."payout_accounts" ADD CONSTRAINT "payout_accounts_config_gateway_fkey" FOREIGN KEY ("payment_gateway_config_id","gateway_code") REFERENCES "core"."payment_gateway_configs"("id","gateway_code") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "core"."payout_channels" ADD CONSTRAINT "payout_channels_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."payout_channels" ADD CONSTRAINT "payout_channels_legal_entity_id_legal_entities_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "core"."legal_entities"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "core"."payout_channels" ADD CONSTRAINT "payout_channels_site_id_sites_id_fkey" FOREIGN KEY ("site_id") REFERENCES "core"."sites"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."payout_channels" ADD CONSTRAINT "payout_channels_app_id_apps_id_fkey" FOREIGN KEY ("app_id") REFERENCES "core"."apps"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."payout_channels" ADD CONSTRAINT "payout_channels_bank_account_le_fkey" FOREIGN KEY ("bank_account_id","legal_entity_id") REFERENCES "core"."bank_accounts"("id","legal_entity_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "core"."payout_channel_accounts" ADD CONSTRAINT "payout_channel_accounts_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."payout_channel_accounts" ADD CONSTRAINT "payout_channel_accounts_channel_bank_fkey" FOREIGN KEY ("payout_channel_id","bank_account_id") REFERENCES "core"."payout_channels"("id","bank_account_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."payout_channel_accounts" ADD CONSTRAINT "payout_channel_accounts_account_bank_fkey" FOREIGN KEY ("payout_account_id","bank_account_id") REFERENCES "core"."payout_accounts"("id","bank_account_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "core"."app_webhook_endpoints" ADD CONSTRAINT "app_webhook_endpoints_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."app_webhook_endpoints" ADD CONSTRAINT "app_webhook_endpoints_app_id_apps_id_fkey" FOREIGN KEY ("app_id") REFERENCES "core"."apps"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_app_id_apps_id_fkey" FOREIGN KEY ("app_id") REFERENCES "core"."apps"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_endpoint_id_app_webhook_endpoints_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "core"."app_webhook_endpoints"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."roles" ADD CONSTRAINT "roles_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "core"."roles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_site_id_sites_id_fkey" FOREIGN KEY ("site_id") REFERENCES "core"."sites"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_site_group_id_site_groups_id_fkey" FOREIGN KEY ("site_group_id") REFERENCES "core"."site_groups"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_legal_entity_id_legal_entities_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "core"."legal_entities"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_granted_by_users_id_fkey" FOREIGN KEY ("granted_by") REFERENCES "core"."users"("id") ON DELETE SET NULL;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."media" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."org_services" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."legal_entities" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."site_groups" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."sites" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."bank_accounts" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."payment_gateway_configs" AS PERMISSIVE FOR ALL TO public USING (organization_id IS NULL OR organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."payout_accounts" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."payout_channels" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."payout_channel_accounts" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."app_webhook_endpoints" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."webhook_deliveries" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."roles" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));