-- Copies each payout account's gateway code from its config, then refuses to go on while any bank account holds two
-- payout accounts of one gateway: the unique key added next would fail, and which to keep is the owner's call.
UPDATE "core"."payout_accounts" AS pa
SET "gateway_code" = c."gateway_code"
FROM "core"."payment_gateway_configs" AS c
WHERE c."id" = pa."payment_gateway_config_id";
--> statement-breakpoint
DO $$
DECLARE
  dup record;
BEGIN
  SELECT pa."bank_account_id", pa."gateway_code", count(*) AS n
  INTO dup
  FROM "core"."payout_accounts" AS pa
  GROUP BY pa."bank_account_id", pa."gateway_code"
  HAVING count(*) > 1
  LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'Bank account % has % payout accounts through %. Remove all but one, then run the migration again.',
      dup."bank_account_id", dup.n, dup."gateway_code";
  END IF;
END $$;
