CREATE TYPE "core"."app_type" AS ENUM('GRAPHQL');--> statement-breakpoint
CREATE TYPE "core"."party_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TABLE "core"."party_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"full_name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"phone_country" varchar(5),
	"status" "core"."party_status" DEFAULT 'ACTIVE'::"core"."party_status" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"locale" varchar(10) DEFAULT 'en' NOT NULL,
	"timezone" varchar(50) DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "core"."apps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"client_id" varchar(64) NOT NULL,
	"name" varchar(120) NOT NULL,
	"type" "core"."app_type" NOT NULL,
	"signing_key" text NOT NULL,
	"signing_public_key" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "party_identities_email_org_unique" ON "core"."party_identities" ("email","organization_id");--> statement-breakpoint
CREATE INDEX "idx_party_identities_org" ON "core"."party_identities" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_access_token_hash" ON "core"."sessions" ("access_token_hash");--> statement-breakpoint
CREATE INDEX "idx_sessions_refresh_token_hash" ON "core"."sessions" ("refresh_token_hash");--> statement-breakpoint
CREATE INDEX "idx_sessions_user" ON "core"."sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_expires_at" ON "core"."sessions" ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "apps_client_id_unique" ON "core"."apps" ("client_id");--> statement-breakpoint
CREATE INDEX "idx_apps_org" ON "core"."apps" ("organization_id");--> statement-breakpoint
ALTER TABLE "core"."party_identities" ADD CONSTRAINT "party_identities_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."apps" ADD CONSTRAINT "apps_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;