CREATE SCHEMA "payments";
--> statement-breakpoint
CREATE TYPE "payments"."payment_attempt_status" AS ENUM('CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "payments"."payment_channel_type" AS ENUM('APP', 'POS', 'B2B');--> statement-breakpoint
CREATE TYPE "payments"."payment_event_status" AS ENUM('PENDING', 'ACKED');--> statement-breakpoint
CREATE TYPE "payments"."payment_intent_status" AS ENUM('CREATED', 'REQUIRES_ACTION', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "payments"."payment_transfer_status" AS ENUM('CREATED', 'PENDING', 'PROCESSED', 'FAILED', 'REVERSED', 'PARTIALLY_REVERSED');--> statement-breakpoint
CREATE TYPE "payments"."webhook_event_status" AS ENUM('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED');--> statement-breakpoint
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
CREATE TABLE "payments"."payment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"intent_id" uuid NOT NULL,
	"provider_payment_id" varchar(100),
	"status" "payments"."payment_attempt_status" DEFAULT 'CREATED'::"payments"."payment_attempt_status" NOT NULL,
	"method" varchar(30),
	"error_code" varchar(100),
	"error_message" text,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments"."payment_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payments"."payment_events" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"intent_id" uuid NOT NULL,
	"type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "payments"."payment_event_status" DEFAULT 'PENDING'::"payments"."payment_event_status" NOT NULL,
	"acked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments"."payment_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payments"."payment_intents" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"legal_entity_id" uuid,
	"site_id" uuid,
	"app_id" uuid,
	"party_id" uuid,
	"config_id" uuid NOT NULL,
	"gateway_code" varchar(100) NOT NULL,
	"bank_account_id" uuid,
	"type" "payments"."payment_channel_type" NOT NULL,
	"reference_type" varchar(100) NOT NULL,
	"reference_id" varchar(200) NOT NULL,
	"description" varchar(500),
	"idempotency_key" varchar(100) NOT NULL,
	"receipt" varchar(40) NOT NULL,
	"amount" bigint NOT NULL,
	"currency" char(3) NOT NULL,
	"status" "payments"."payment_intent_status" DEFAULT 'CREATED'::"payments"."payment_intent_status" NOT NULL,
	"provider_order_id" varchar(100),
	"provider_payment_id" varchar(100),
	"checkout" jsonb,
	"method" varchar(30),
	"fee" bigint,
	"tax" bigint,
	"customer" jsonb,
	"metadata" jsonb,
	"return_url" varchar(2048),
	"checkout_url" varchar(2048),
	"failure_code" varchar(100),
	"failure_message" text,
	"succeeded_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_payment_intents_org_idempotency_key" UNIQUE("organization_id","idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "payments"."payment_intents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payments"."payment_transfers" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"intent_id" uuid NOT NULL,
	"linked_account_id" uuid NOT NULL,
	"provider_account_id" varchar(100) NOT NULL,
	"amount" bigint NOT NULL,
	"currency" char(3) NOT NULL,
	"on_hold" boolean DEFAULT false NOT NULL,
	"on_hold_until" timestamp with time zone,
	"status" "payments"."payment_transfer_status" DEFAULT 'CREATED'::"payments"."payment_transfer_status" NOT NULL,
	"provider_transfer_id" varchar(100) CONSTRAINT "uq_payment_transfers_provider_transfer_id" UNIQUE,
	"error_code" varchar(100),
	"error_description" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_payment_transfers_intent_linked_account" UNIQUE("intent_id","linked_account_id")
);
--> statement-breakpoint
ALTER TABLE "payments"."payment_transfers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payments"."webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"config_id" uuid NOT NULL,
	"gateway_code" varchar(100) NOT NULL,
	"dedupe_key" varchar(150) NOT NULL,
	"provider_event_id" varchar(150) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload_hash" varchar(64) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "payments"."webhook_event_status" DEFAULT 'RECEIVED'::"payments"."webhook_event_status" NOT NULL,
	"error" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "uq_webhook_events_org_gateway_dedupe" UNIQUE("organization_id","gateway_code","dedupe_key")
);
--> statement-breakpoint
ALTER TABLE "payments"."webhook_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_payment_allocations_intent" ON "payments"."payment_allocations" ("intent_id");--> statement-breakpoint
CREATE INDEX "idx_payment_allocations_legal_entity" ON "payments"."payment_allocations" ("organization_id","legal_entity_id");--> statement-breakpoint
CREATE INDEX "idx_payment_allocations_bank_account" ON "payments"."payment_allocations" ("organization_id","bank_account_id");--> statement-breakpoint
CREATE INDEX "idx_payment_attempts_intent" ON "payments"."payment_attempts" ("intent_id");--> statement-breakpoint
CREATE INDEX "idx_payment_events_pending" ON "payments"."payment_events" ("organization_id","status","created_at");--> statement-breakpoint
CREATE INDEX "idx_payment_events_intent" ON "payments"."payment_events" ("intent_id");--> statement-breakpoint
CREATE INDEX "idx_payment_intents_org_status" ON "payments"."payment_intents" ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_payment_intents_provider_order" ON "payments"."payment_intents" ("provider_order_id");--> statement-breakpoint
CREATE INDEX "idx_payment_intents_config" ON "payments"."payment_intents" ("config_id");--> statement-breakpoint
CREATE INDEX "idx_payment_intents_reference" ON "payments"."payment_intents" ("organization_id","reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "idx_payment_intents_expiry" ON "payments"."payment_intents" ("status","expires_at");--> statement-breakpoint
CREATE INDEX "idx_payment_transfers_intent" ON "payments"."payment_transfers" ("intent_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_events_config_received" ON "payments"."webhook_events" ("config_id","received_at");--> statement-breakpoint
ALTER TABLE "payments"."payment_allocations" ADD CONSTRAINT "payment_allocations_intent_id_payment_intents_id_fkey" FOREIGN KEY ("intent_id") REFERENCES "payments"."payment_intents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payments"."payment_allocations" ADD CONSTRAINT "payment_allocations_transfer_id_payment_transfers_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "payments"."payment_transfers"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "payments"."payment_attempts" ADD CONSTRAINT "payment_attempts_intent_id_payment_intents_id_fkey" FOREIGN KEY ("intent_id") REFERENCES "payments"."payment_intents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payments"."payment_events" ADD CONSTRAINT "payment_events_intent_id_payment_intents_id_fkey" FOREIGN KEY ("intent_id") REFERENCES "payments"."payment_intents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payments"."payment_transfers" ADD CONSTRAINT "payment_transfers_intent_id_payment_intents_id_fkey" FOREIGN KEY ("intent_id") REFERENCES "payments"."payment_intents"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "payments"."payment_allocations" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "payments"."payment_attempts" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "payments"."payment_events" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "payments"."payment_intents" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "payments"."payment_transfers" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "payments"."webhook_events" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));