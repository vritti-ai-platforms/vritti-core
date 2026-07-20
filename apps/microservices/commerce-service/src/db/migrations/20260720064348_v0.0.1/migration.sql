CREATE TYPE "vritti_core"."party_contact_purpose" AS ENUM('ORDER', 'ACCOUNTS', 'ESCALATION');--> statement-breakpoint
CREATE TABLE "vritti_core"."party_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"party_id" uuid NOT NULL,
	"purpose" "vritti_core"."party_contact_purpose" NOT NULL,
	"label" varchar(120),
	"name" varchar(150),
	"email" varchar(255),
	"phone" varchar(20),
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."party_contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_sites" ADD COLUMN "order_contact_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_party_contacts_primary" ON "vritti_core"."party_contacts" ("party_id","purpose") WHERE is_primary = true;--> statement-breakpoint
CREATE INDEX "idx_party_contacts_party" ON "vritti_core"."party_contacts" ("party_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."party_contacts" ADD CONSTRAINT "party_contacts_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "vritti_core"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_sites" ADD CONSTRAINT "fk_supplier_sites_order_contact" FOREIGN KEY ("order_contact_id") REFERENCES "vritti_core"."party_contacts"("id") ON DELETE SET NULL;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."party_contacts" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));