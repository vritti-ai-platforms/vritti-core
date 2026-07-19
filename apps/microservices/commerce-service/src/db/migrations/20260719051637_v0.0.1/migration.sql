CREATE TYPE "vritti_core"."party_license_type" AS ENUM('DRUG', 'EXCISE', 'FSSAI', 'OTHER');--> statement-breakpoint
CREATE TYPE "vritti_core"."supplier_price_source" AS ENUM('QUOTATION', 'MANUAL', 'IMPORT');--> statement-breakpoint
CREATE TABLE "vritti_core"."party_bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"party_id" uuid NOT NULL,
	"account_name" varchar(255) NOT NULL,
	"account_number" varchar(50) NOT NULL,
	"ifsc_code" varchar(20),
	"upi_id" varchar(100),
	"bank_name" varchar(255),
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_party_bank_accounts_party_number" UNIQUE("party_id","account_number")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."party_bank_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."party_licenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"party_id" uuid NOT NULL,
	"license_type" "vritti_core"."party_license_type" NOT NULL,
	"license_number" varchar(100) NOT NULL,
	"region" varchar(120),
	"valid_to" date,
	"notes" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_party_licenses_org_type_number" UNIQUE("organization_id","license_type","license_number")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."party_licenses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."supplier_item_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"supplier_item_id" uuid NOT NULL,
	"site_id" uuid DEFAULT cast(current_setting('app.site_id', true) as uuid),
	"unit_price" bigint NOT NULL,
	"scheme_buy_qty" numeric(12,3),
	"scheme_free_qty" numeric(12,3),
	"valid_from" date NOT NULL,
	"valid_to" date,
	"source" "vritti_core"."supplier_price_source" DEFAULT 'MANUAL'::"vritti_core"."supplier_price_source" NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_item_prices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."supplier_item_sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"supplier_item_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"lead_time_days" integer,
	"min_order_quantity" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_supplier_item_sites" UNIQUE("supplier_item_id","site_id")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_item_sites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vritti_core"."supplier_sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"legal_entity_id" uuid DEFAULT cast(current_setting('app.le_id') as uuid) NOT NULL,
	"supplier_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"party_tax_registration_id" uuid,
	"party_bank_account_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_supplier_sites" UNIQUE("supplier_id","site_id")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_sites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" ADD COLUMN "purchasing_blocked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" ADD COLUMN "payment_blocked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" ADD COLUMN "order_email" varchar(255);--> statement-breakpoint
ALTER TABLE "vritti_core"."suppliers" ADD COLUMN "order_phone" varchar(20);--> statement-breakpoint
INSERT INTO "vritti_core"."supplier_item_prices"
  ("organization_id", "supplier_item_id", "site_id", "unit_price", "scheme_buy_qty", "scheme_free_qty", "valid_from", "valid_to", "source")
SELECT si."organization_id", si."id", NULL, si."unit_price", si."scheme_buy_qty", si."scheme_free_qty",
       si."created_at"::date, NULL, 'MANUAL'
FROM "vritti_core"."supplier_items" si;--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_items" DROP COLUMN "unit_price";--> statement-breakpoint
CREATE UNIQUE INDEX "uq_party_bank_accounts_primary" ON "vritti_core"."party_bank_accounts" ("party_id") WHERE is_primary = true;--> statement-breakpoint
CREATE INDEX "idx_party_bank_accounts_party" ON "vritti_core"."party_bank_accounts" ("party_id");--> statement-breakpoint
CREATE INDEX "idx_party_licenses_party" ON "vritti_core"."party_licenses" ("party_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_item_prices_site_from" ON "vritti_core"."supplier_item_prices" ("supplier_item_id","site_id","valid_from") WHERE site_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_item_prices_general_from" ON "vritti_core"."supplier_item_prices" ("supplier_item_id","valid_from") WHERE site_id IS NULL;--> statement-breakpoint
CREATE INDEX "idx_supplier_item_prices_item" ON "vritti_core"."supplier_item_prices" ("supplier_item_id","valid_from");--> statement-breakpoint
CREATE INDEX "idx_supplier_item_prices_site" ON "vritti_core"."supplier_item_prices" ("site_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_item_sites_site" ON "vritti_core"."supplier_item_sites" ("site_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_sites_supplier" ON "vritti_core"."supplier_sites" ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_sites_site" ON "vritti_core"."supplier_sites" ("site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_suppliers_le_party" ON "vritti_core"."suppliers" ("legal_entity_id","party_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."party_bank_accounts" ADD CONSTRAINT "party_bank_accounts_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "vritti_core"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."party_licenses" ADD CONSTRAINT "party_licenses_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "vritti_core"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_item_prices" ADD CONSTRAINT "supplier_item_prices_supplier_item_id_supplier_items_id_fkey" FOREIGN KEY ("supplier_item_id") REFERENCES "vritti_core"."supplier_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_item_sites" ADD CONSTRAINT "supplier_item_sites_supplier_item_id_supplier_items_id_fkey" FOREIGN KEY ("supplier_item_id") REFERENCES "vritti_core"."supplier_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_sites" ADD CONSTRAINT "supplier_sites_supplier_id_suppliers_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "vritti_core"."suppliers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_sites" ADD CONSTRAINT "fk_supplier_sites_tax_registration" FOREIGN KEY ("party_tax_registration_id") REFERENCES "vritti_core"."party_tax_registrations"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."supplier_sites" ADD CONSTRAINT "fk_supplier_sites_bank_account" FOREIGN KEY ("party_bank_account_id") REFERENCES "vritti_core"."party_bank_accounts"("id") ON DELETE SET NULL;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."party_bank_accounts" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."party_licenses" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."supplier_item_prices" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."supplier_item_prices" AS PERMISSIVE FOR SELECT TO public USING (site_id IS NULL OR site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."supplier_item_prices" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."supplier_item_prices" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."supplier_item_prices" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."supplier_item_sites" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."supplier_item_sites" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."supplier_item_sites" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."supplier_item_sites" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."supplier_item_sites" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."supplier_sites" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "le_read" ON "vritti_core"."supplier_sites" AS PERMISSIVE FOR SELECT TO public USING (legal_entity_id = (select current_setting('app.le_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "le_write" ON "vritti_core"."supplier_sites" AS PERMISSIVE FOR INSERT TO public WITH CHECK (legal_entity_id = (select current_setting('app.le_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "le_update" ON "vritti_core"."supplier_sites" AS PERMISSIVE FOR UPDATE TO public USING (legal_entity_id = (select current_setting('app.le_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "le_delete" ON "vritti_core"."supplier_sites" AS PERMISSIVE FOR DELETE TO public USING (legal_entity_id = (select current_setting('app.le_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_read" ON "vritti_core"."supplier_sites" AS PERMISSIVE FOR SELECT TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_write" ON "vritti_core"."supplier_sites" AS PERMISSIVE FOR INSERT TO public WITH CHECK (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_update" ON "vritti_core"."supplier_sites" AS PERMISSIVE FOR UPDATE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "site_delete" ON "vritti_core"."supplier_sites" AS PERMISSIVE FOR DELETE TO public USING (site_id = (select current_setting('app.site_id', true)::uuid));