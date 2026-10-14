ALTER TABLE "payments"."webhook_events" DROP CONSTRAINT "uq_webhook_events_gateway_provider_event";--> statement-breakpoint
ALTER TABLE "payments"."webhook_events" ADD COLUMN "dedupe_key" varchar(150);--> statement-breakpoint
-- Backfill from the signed-body hash; any older row repeating a body (a replay the old header key let through) keeps
-- its history under a suffixed key instead of being deleted, so the new constraint can be added
UPDATE "payments"."webhook_events" AS e SET "dedupe_key" = CASE
  WHEN EXISTS (
    SELECT 1 FROM "payments"."webhook_events" AS earlier
    WHERE earlier."organization_id" = e."organization_id"
      AND earlier."gateway_code" = e."gateway_code"
      AND earlier."payload_hash" = e."payload_hash"
      AND (earlier."received_at", earlier."id") < (e."received_at", e."id")
  ) THEN e."payload_hash" || ':' || e."id"::text
  ELSE e."payload_hash"
END;--> statement-breakpoint
ALTER TABLE "payments"."webhook_events" ALTER COLUMN "dedupe_key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payments"."payment_transfers" ALTER COLUMN "provider_account_id" SET DATA TYPE varchar(100) USING "provider_account_id"::varchar(100);--> statement-breakpoint
ALTER TABLE "payments"."payment_transfers" ALTER COLUMN "currency" SET DATA TYPE char(3) USING "currency"::char(3);--> statement-breakpoint
ALTER TABLE "payments"."payment_transfers" ALTER COLUMN "provider_transfer_id" SET DATA TYPE varchar(100) USING "provider_transfer_id"::varchar(100);--> statement-breakpoint
ALTER TABLE "payments"."payment_transfers" ADD CONSTRAINT "uq_payment_transfers_intent_linked_account" UNIQUE("intent_id","linked_account_id");--> statement-breakpoint
ALTER TABLE "payments"."webhook_events" ADD CONSTRAINT "uq_webhook_events_org_gateway_dedupe" UNIQUE("organization_id","gateway_code","dedupe_key");