-- Custom SQL migration file, put your code below! --

-- Payout accounts become the account itself (a bank account reached through one gateway account) and their scope
-- moves to payout channels. Rows naming the same gateway account collapse onto the oldest of them; every old row
-- becomes a channel of that account. One gateway account cannot pay two legal entities, so that stops the migration.
DO $$
DECLARE
  conflicting text;
BEGIN
  SELECT string_agg(format('%s on config %s', gateway_account_id, payment_gateway_config_id), ', ')
  INTO conflicting
  FROM (
    SELECT payment_gateway_config_id, gateway_account_id
    FROM "core"."payout_accounts"
    GROUP BY payment_gateway_config_id, gateway_account_id
    HAVING count(DISTINCT legal_entity_id) > 1
  ) AS shared;

  IF conflicting IS NOT NULL THEN
    RAISE EXCEPTION 'payout_accounts: gateway accounts % pay more than one legal entity; give each its own account before migrating', conflicting;
  END IF;
END $$;--> statement-breakpoint

CREATE TEMP TABLE pa_survivors AS
SELECT DISTINCT ON (payment_gateway_config_id, gateway_account_id)
  payment_gateway_config_id, gateway_account_id, id AS survivor_id
FROM "core"."payout_accounts"
ORDER BY payment_gateway_config_id, gateway_account_id, created_at, id;--> statement-breakpoint

INSERT INTO "core"."payout_channels"
  (organization_id, payout_account_id, legal_entity_id, site_id, app_id, channel, created_at, updated_at)
SELECT pa.organization_id, s.survivor_id, pa.legal_entity_id, pa.site_id, pa.app_id, pa.channel, pa.created_at, pa.updated_at
FROM "core"."payout_accounts" pa
JOIN pa_survivors s
  ON s.payment_gateway_config_id = pa.payment_gateway_config_id AND s.gateway_account_id = pa.gateway_account_id;--> statement-breakpoint

DELETE FROM "core"."payout_accounts" pa
USING pa_survivors s
WHERE s.payment_gateway_config_id = pa.payment_gateway_config_id
  AND s.gateway_account_id = pa.gateway_account_id
  AND pa.id <> s.survivor_id;--> statement-breakpoint

DROP TABLE pa_survivors;
