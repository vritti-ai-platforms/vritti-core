CREATE TYPE "vritti_core"."party_address_type" AS ENUM('REGISTERED', 'BILLING', 'SHIPPING', 'OTHER');--> statement-breakpoint
CREATE TABLE "vritti_core"."party_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"party_id" uuid NOT NULL,
	"type" "vritti_core"."party_address_type" NOT NULL,
	"line1" varchar(255) NOT NULL,
	"line2" varchar(255),
	"city" varchar(120),
	"region" varchar(120),
	"postal_code" varchar(20),
	"country_code" varchar(2) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."party_addresses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vritti_core"."parties" ADD COLUMN "country_code" varchar(2);--> statement-breakpoint
CREATE INDEX "idx_party_addresses_party" ON "vritti_core"."party_addresses" ("party_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."party_addresses" ADD CONSTRAINT "party_addresses_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "vritti_core"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."party_addresses" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));