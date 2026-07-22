CREATE TYPE "vritti_core"."party_communication_channel" AS ENUM('EMAIL', 'PHONE');--> statement-breakpoint
CREATE TABLE "vritti_core"."party_communications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"party_id" uuid NOT NULL,
	"channel" "vritti_core"."party_communication_channel" NOT NULL,
	"value" varchar(255) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_party_communications_party_channel_value" UNIQUE("party_id","channel","value")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."party_communications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY "org_isolation" ON "vritti_core"."party_contacts";--> statement-breakpoint
ALTER TABLE "vritti_core"."party_functions" DROP CONSTRAINT IF EXISTS "party_functions_target_chk";--> statement-breakpoint
ALTER TABLE "vritti_core"."party_functions" DROP CONSTRAINT "fk_party_functions_contact";--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_sites" DROP CONSTRAINT "fk_supplier_sites_order_contact";--> statement-breakpoint
DROP TABLE "vritti_core"."party_contacts";--> statement-breakpoint
ALTER TABLE "vritti_core"."party_functions" DROP CONSTRAINT "uq_party_functions_contact_function";--> statement-breakpoint
ALTER TABLE "vritti_core"."party_functions" ADD COLUMN "party_relationship_id" uuid;--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_sites" ADD COLUMN "order_relationship_id" uuid;--> statement-breakpoint
ALTER TABLE "vritti_core"."party_functions" ALTER COLUMN "function" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "vritti_core"."party_function_type";--> statement-breakpoint
CREATE TYPE "vritti_core"."party_function_type" AS ENUM('REGISTERED', 'BILLING', 'SHIPPING', 'ORDERING', 'ORDER', 'ACCOUNTS', 'LOGISTICS', 'ESCALATION');--> statement-breakpoint
ALTER TABLE "vritti_core"."party_functions" ALTER COLUMN "function" SET DATA TYPE "vritti_core"."party_function_type" USING "function"::"vritti_core"."party_function_type";--> statement-breakpoint
ALTER TABLE "vritti_core"."party_functions" DROP COLUMN "party_contact_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_sites" DROP COLUMN "order_contact_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."party_addresses" DROP COLUMN "is_primary";--> statement-breakpoint
ALTER TABLE "vritti_core"."party_functions" ADD CONSTRAINT "uq_party_functions_relationship_function" UNIQUE("party_relationship_id","function");--> statement-breakpoint
ALTER TABLE "vritti_core"."party_relationships" ADD CONSTRAINT "uq_party_rel_parent_id" UNIQUE("parent_party_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_party_communications_primary" ON "vritti_core"."party_communications" ("party_id","channel") WHERE is_primary = true;--> statement-breakpoint
CREATE INDEX "idx_party_communications_party" ON "vritti_core"."party_communications" ("party_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."party_communications" ADD CONSTRAINT "party_communications_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "vritti_core"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."party_functions" ADD CONSTRAINT "fk_party_functions_relationship" FOREIGN KEY ("party_id","party_relationship_id") REFERENCES "vritti_core"."party_relationships"("parent_party_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_sites" ADD CONSTRAINT "fk_supplier_sites_order_relationship" FOREIGN KEY ("order_relationship_id") REFERENCES "vritti_core"."party_relationships"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."party_functions" ADD CONSTRAINT "party_functions_target_chk" CHECK (("function" IN ('REGISTERED','BILLING','SHIPPING','ORDERING') AND party_address_id IS NOT NULL AND party_relationship_id IS NULL) OR ("function" IN ('ORDER','ACCOUNTS','LOGISTICS','ESCALATION') AND party_relationship_id IS NOT NULL AND party_address_id IS NULL));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."party_communications" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));