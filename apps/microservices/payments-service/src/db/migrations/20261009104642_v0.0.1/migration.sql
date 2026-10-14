CREATE TYPE "payments"."payment_event_status" AS ENUM('PENDING', 'ACKED');--> statement-breakpoint
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
ALTER TABLE "payments"."payment_intents" ADD COLUMN "party_id" uuid;--> statement-breakpoint
ALTER TABLE "payments"."payment_intents" ADD COLUMN "reference_type" varchar(100);--> statement-breakpoint
ALTER TABLE "payments"."payment_intents" ADD COLUMN "reference_id" varchar(200);--> statement-breakpoint
-- No caller opened intents before this migration, but any row that exists is labelled rather than blocking it
UPDATE "payments"."payment_intents" SET "reference_type" = 'legacy', "reference_id" = "id"::text WHERE "reference_type" IS NULL;--> statement-breakpoint
ALTER TABLE "payments"."payment_intents" ALTER COLUMN "reference_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payments"."payment_intents" ALTER COLUMN "reference_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payments"."payment_intents" ADD COLUMN "description" varchar(500);--> statement-breakpoint
ALTER TABLE "payments"."payment_intents" ADD COLUMN "checkout" jsonb;--> statement-breakpoint
CREATE INDEX "idx_payment_events_pending" ON "payments"."payment_events" ("organization_id","status","created_at");--> statement-breakpoint
CREATE INDEX "idx_payment_events_intent" ON "payments"."payment_events" ("intent_id");--> statement-breakpoint
CREATE INDEX "idx_payment_intents_reference" ON "payments"."payment_intents" ("organization_id","reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "idx_payment_intents_expiry" ON "payments"."payment_intents" ("status","expires_at");--> statement-breakpoint
ALTER TABLE "payments"."payment_events" ADD CONSTRAINT "payment_events_intent_id_payment_intents_id_fkey" FOREIGN KEY ("intent_id") REFERENCES "payments"."payment_intents"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "payments"."payment_events" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));