CREATE TYPE "nexus"."org_plan" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "nexus"."org_size" AS ENUM('0-10', '10-20', '20-50', '50-100', '100-500', '500+');--> statement-breakpoint
ALTER TYPE "nexus"."session_type" ADD VALUE 'RESET';--> statement-breakpoint
CREATE TABLE "nexus"."verifications" (
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
CREATE TABLE "nexus"."organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"subdomain" varchar(100) NOT NULL UNIQUE,
	"industry_id" integer,
	"size" "nexus"."org_size" NOT NULL,
	"media_id" integer,
	"plan" "nexus"."org_plan" DEFAULT 'free'::"nexus"."org_plan" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nexus"."verifications" ADD CONSTRAINT "verifications_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "nexus"."users"("id") ON DELETE CASCADE;