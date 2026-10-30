CREATE TABLE "payments"."payment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"intent_id" uuid NOT NULL,
	"legal_entity_id" uuid NOT NULL,
	"site_id" uuid,
	"payout_account_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"gateway_account_id" varchar(100) NOT NULL,
	"is_main_account" boolean NOT NULL,
	"gross_amount" bigint NOT NULL,
	"platform_fee_amount" bigint NOT NULL,
	"net_amount" bigint NOT NULL,
	"currency" char(3) NOT NULL,
	"transfer_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments"."payment_allocations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_payment_allocations_intent" ON "payments"."payment_allocations" ("intent_id");--> statement-breakpoint
CREATE INDEX "idx_payment_allocations_legal_entity" ON "payments"."payment_allocations" ("organization_id","legal_entity_id");--> statement-breakpoint
CREATE INDEX "idx_payment_allocations_bank_account" ON "payments"."payment_allocations" ("organization_id","bank_account_id");--> statement-breakpoint
ALTER TABLE "payments"."payment_allocations" ADD CONSTRAINT "payment_allocations_intent_id_payment_intents_id_fkey" FOREIGN KEY ("intent_id") REFERENCES "payments"."payment_intents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payments"."payment_allocations" ADD CONSTRAINT "payment_allocations_transfer_id_payment_transfers_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "payments"."payment_transfers"("id") ON DELETE SET NULL;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "payments"."payment_allocations" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));