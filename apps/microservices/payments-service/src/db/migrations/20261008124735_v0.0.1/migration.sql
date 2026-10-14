CREATE TYPE "payments"."payment_transfer_status" AS ENUM('CREATED', 'PENDING', 'PROCESSED', 'FAILED', 'REVERSED', 'PARTIALLY_REVERSED');--> statement-breakpoint
CREATE TABLE "payments"."payment_transfers" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"intent_id" uuid NOT NULL,
	"linked_account_id" uuid NOT NULL,
	"provider_account_id" varchar(50) NOT NULL,
	"amount" bigint NOT NULL,
	"currency" varchar(3) NOT NULL,
	"on_hold" boolean DEFAULT false NOT NULL,
	"on_hold_until" timestamp with time zone,
	"status" "payments"."payment_transfer_status" DEFAULT 'CREATED'::"payments"."payment_transfer_status" NOT NULL,
	"provider_transfer_id" varchar(50) CONSTRAINT "uq_payment_transfers_provider_transfer_id" UNIQUE,
	"error_code" varchar(100),
	"error_description" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments"."payment_transfers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_payment_transfers_intent" ON "payments"."payment_transfers" ("intent_id");--> statement-breakpoint
ALTER TABLE "payments"."payment_transfers" ADD CONSTRAINT "payment_transfers_intent_id_payment_intents_id_fkey" FOREIGN KEY ("intent_id") REFERENCES "payments"."payment_intents"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "payments"."payment_transfers" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));