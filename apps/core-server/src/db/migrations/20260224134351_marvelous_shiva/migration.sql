CREATE SCHEMA "nexus";
--> statement-breakpoint
CREATE TYPE "nexus"."session_type" AS ENUM('NEXUS', 'SET_PASSWORD');--> statement-breakpoint
CREATE TYPE "nexus"."user_role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'SUPPORT');--> statement-breakpoint
CREATE TYPE "nexus"."user_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TABLE "nexus"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"external_id" varchar(255) UNIQUE,
	"email" varchar(255) NOT NULL UNIQUE,
	"password_hash" text,
	"full_name" varchar(255) NOT NULL,
	"role" "nexus"."user_role" DEFAULT 'SUPPORT'::"nexus"."user_role" NOT NULL,
	"status" "nexus"."user_status" DEFAULT 'PENDING'::"nexus"."user_status" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "nexus"."sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"type" "nexus"."session_type" DEFAULT 'NEXUS'::"nexus"."session_type" NOT NULL,
	"access_token_hash" text NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nexus"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "nexus"."users"("id") ON DELETE CASCADE;