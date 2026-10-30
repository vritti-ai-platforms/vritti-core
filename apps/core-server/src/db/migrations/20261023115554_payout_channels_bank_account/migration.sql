-- Gives each payout channel its payout account's bank account, merges channels that share a scope into the oldest,
-- and records every merged channel's payout account as switched on. A scope whose channels use payout accounts of
-- two bank accounts cannot be merged, since a scope now pays out to one bank account; the owner picks which.
UPDATE "core"."payout_channels" AS pc
SET "bank_account_id" = pa."bank_account_id"
FROM "core"."payout_accounts" AS pa
WHERE pa."id" = pc."payout_account_id";
--> statement-breakpoint
DO $$
DECLARE
  mixed record;
BEGIN
  SELECT pc."legal_entity_id", pc."site_id", pc."app_id", pc."channel", count(DISTINCT pc."bank_account_id") AS banks
  INTO mixed
  FROM "core"."payout_channels" AS pc
  GROUP BY pc."legal_entity_id", pc."site_id", pc."app_id", pc."channel"
  HAVING count(DISTINCT pc."bank_account_id") > 1
  LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'Legal entity % (site %, app %, channel %) pays out to % bank accounts. Keep payouts of one bank account for that scope, then run the migration again.',
      mixed."legal_entity_id", coalesce(mixed."site_id"::text, 'all'), coalesce(mixed."app_id"::text, 'all'),
      coalesce(mixed."channel"::text, 'all'), mixed.banks;
  END IF;
END $$;
--> statement-breakpoint
INSERT INTO "core"."payout_channel_accounts" ("organization_id", "payout_channel_id", "payout_account_id", "bank_account_id")
SELECT k."organization_id", k."keep_id", k."payout_account_id", k."bank_account_id"
FROM (
  SELECT pc."organization_id", pc."payout_account_id", pc."bank_account_id",
    first_value(pc."id") OVER (
      PARTITION BY pc."legal_entity_id", pc."site_id", pc."app_id", pc."channel"
      ORDER BY pc."created_at", pc."id"
    ) AS "keep_id"
  FROM "core"."payout_channels" AS pc
) AS k
ON CONFLICT ("payout_channel_id", "payout_account_id") DO NOTHING;
--> statement-breakpoint
DELETE FROM "core"."payout_channels" AS pc
USING (
  SELECT c."id",
    first_value(c."id") OVER (
      PARTITION BY c."legal_entity_id", c."site_id", c."app_id", c."channel"
      ORDER BY c."created_at", c."id"
    ) AS "keep_id"
  FROM "core"."payout_channels" AS c
) AS k
WHERE k."id" = pc."id" AND k."keep_id" <> pc."id";
