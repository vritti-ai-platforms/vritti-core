CREATE SCHEMA "payments";
--> statement-breakpoint
CREATE TYPE "payments"."payment_attempt_status" AS ENUM('CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "payments"."payment_channel_type" AS ENUM('APP', 'POS', 'B2B');--> statement-breakpoint
CREATE TYPE "payments"."payment_intent_status" AS ENUM('CREATED', 'REQUIRES_ACTION', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "payments"."webhook_event_status" AS ENUM('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED');--> statement-breakpoint
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
CREATE TABLE "payments"."payment_intents" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"legal_entity_id" uuid NOT NULL,
	"site_id" uuid,
	"app_id" uuid,
	"config_id" uuid NOT NULL,
	"gateway_code" varchar(100) NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"type" "payments"."payment_channel_type" NOT NULL,
	"idempotency_key" varchar(100) NOT NULL,
	"receipt" varchar(40) NOT NULL,
	"amount" bigint NOT NULL,
	"currency" char(3) NOT NULL,
	"status" "payments"."payment_intent_status" DEFAULT 'CREATED'::"payments"."payment_intent_status" NOT NULL,
	"provider_order_id" varchar(100),
	"provider_payment_id" varchar(100),
	"method" varchar(30),
	"fee" bigint,
	"tax" bigint,
	"customer" jsonb,
	"metadata" jsonb,
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
CREATE TABLE "payments"."webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"config_id" uuid NOT NULL,
	"gateway_code" varchar(100) NOT NULL,
	"provider_event_id" varchar(150) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload_hash" varchar(64) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "payments"."webhook_event_status" DEFAULT 'RECEIVED'::"payments"."webhook_event_status" NOT NULL,
	"error" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "uq_webhook_events_gateway_provider_event" UNIQUE("gateway_code","provider_event_id")
);
--> statement-breakpoint
ALTER TABLE "payments"."webhook_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_payment_attempts_intent" ON "payments"."payment_attempts" ("intent_id");--> statement-breakpoint
CREATE INDEX "idx_payment_intents_org_status" ON "payments"."payment_intents" ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_payment_intents_provider_order" ON "payments"."payment_intents" ("provider_order_id");--> statement-breakpoint
CREATE INDEX "idx_payment_intents_config" ON "payments"."payment_intents" ("config_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_events_config_received" ON "payments"."webhook_events" ("config_id","received_at");--> statement-breakpoint
ALTER TABLE "payments"."payment_attempts" ADD CONSTRAINT "payment_attempts_intent_id_payment_intents_id_fkey" FOREIGN KEY ("intent_id") REFERENCES "payments"."payment_intents"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "payments"."payment_attempts" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "payments"."payment_intents" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "payments"."webhook_events" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));