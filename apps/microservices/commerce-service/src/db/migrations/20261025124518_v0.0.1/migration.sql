CREATE TYPE "commerce"."checkout_status" AS ENUM('OPEN', 'PAID', 'CONVERTED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "commerce"."checkout_lines" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"checkout_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"legal_entity_id" uuid NOT NULL,
	"offering_id" uuid NOT NULL,
	"offering_variant_id" uuid NOT NULL,
	"name" varchar(500) NOT NULL,
	"code" varchar(200) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" bigint NOT NULL,
	"line_total" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commerce"."checkout_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commerce"."checkouts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"app_id" uuid NOT NULL,
	"party_id" uuid NOT NULL,
	"status" "commerce"."checkout_status" DEFAULT 'OPEN'::"commerce"."checkout_status" NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"total_amount" bigint NOT NULL,
	"gateway_code" varchar(100) NOT NULL,
	"checkout_key" varchar(100) NOT NULL,
	"payment_intent_id" uuid CONSTRAINT "uq_checkouts_payment_intent" UNIQUE,
	"customer_name" varchar(255),
	"customer_phone" varchar(20),
	"customer_email" varchar(200),
	"delivery_address" text,
	"notes" text,
	"expires_at" timestamp with time zone NOT NULL,
	"paid_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_checkouts_party_key" UNIQUE("organization_id","party_id","checkout_key")
);
--> statement-breakpoint
ALTER TABLE "commerce"."checkouts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "commerce"."orders" ADD COLUMN "checkout_id" uuid;--> statement-breakpoint
CREATE INDEX "idx_checkout_lines_checkout_site" ON "commerce"."checkout_lines" ("checkout_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_checkouts_party" ON "commerce"."checkouts" ("organization_id","party_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_checkouts_status" ON "commerce"."checkouts" ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_checkout" ON "commerce"."orders" ("checkout_id");--> statement-breakpoint
ALTER TABLE "commerce"."checkout_lines" ADD CONSTRAINT "checkout_lines_checkout_id_checkouts_id_fkey" FOREIGN KEY ("checkout_id") REFERENCES "commerce"."checkouts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."checkout_lines" ADD CONSTRAINT "checkout_lines_offering_id_offerings_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "commerce"."offerings"("id");--> statement-breakpoint
ALTER TABLE "commerce"."checkout_lines" ADD CONSTRAINT "checkout_lines_offering_variant_id_offering_variants_id_fkey" FOREIGN KEY ("offering_variant_id") REFERENCES "commerce"."offering_variants"("id");--> statement-breakpoint
ALTER TABLE "commerce"."checkouts" ADD CONSTRAINT "checkouts_party_id_parties_id_fkey" FOREIGN KEY ("party_id") REFERENCES "commerce"."parties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "commerce"."orders" ADD CONSTRAINT "orders_checkout_id_checkouts_id_fkey" FOREIGN KEY ("checkout_id") REFERENCES "commerce"."checkouts"("id") ON DELETE SET NULL;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."checkout_lines" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "commerce"."checkouts" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));