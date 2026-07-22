CREATE TYPE "vritti_core"."social_platform" AS ENUM('INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'X', 'YOUTUBE', 'TIKTOK');--> statement-breakpoint
CREATE TABLE "vritti_core"."party_social_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"party_id" uuid NOT NULL,
	"platform" "vritti_core"."social_platform" NOT NULL,
	"url" varchar(500) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."party_social_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_party_social_profiles_party" ON "vritti_core"."party_social_profiles" ("party_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."party_social_profiles" ADD CONSTRAINT "party_social_profiles_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "vritti_core"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."party_social_profiles" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));