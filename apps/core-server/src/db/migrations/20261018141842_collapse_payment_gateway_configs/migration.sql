-- Custom SQL migration file, put your code below! --

-- Payment gateway configs become org-level collectors. The legal-entity, site, app and bank-account rows that exist
-- today collapse onto the newest row of each organization, which becomes that organization's default ORG collector.
-- Two rows of one organization that hold different gateway accounts cannot be merged automatically, so the
-- migration stops and names the organizations; collapse those by hand first. Ciphertexts cannot be compared, so the
-- account identity is (gateway_code, key_id).
DO $$
DECLARE
  conflicting text;
BEGIN
  SELECT string_agg(organization_id::text, ', ')
  INTO conflicting
  FROM (
    SELECT organization_id
    FROM "core"."payment_gateway_configs"
    GROUP BY organization_id
    HAVING count(DISTINCT (gateway_code, key_id)) > 1
  ) AS orgs;

  IF conflicting IS NOT NULL THEN
    RAISE EXCEPTION 'payment_gateway_configs: organizations % hold more than one gateway account; keep one config per organization before migrating', conflicting;
  END IF;
END $$;--> statement-breakpoint

CREATE TEMP TABLE pgc_survivors AS
SELECT DISTINCT ON (organization_id) organization_id, id AS survivor_id
FROM "core"."payment_gateway_configs"
ORDER BY organization_id, created_at DESC, id DESC;--> statement-breakpoint

-- Linked accounts registered under a duplicate move to the survivor when the (collector, bank account) pair is free
UPDATE "core"."payment_linked_accounts" la
SET collector_config_id = s.survivor_id
FROM "core"."payment_gateway_configs" c
JOIN pgc_survivors s ON s.organization_id = c.organization_id
WHERE la.collector_config_id = c.id
  AND c.id <> s.survivor_id
  AND NOT EXISTS (
    SELECT 1
    FROM "core"."payment_linked_accounts" other
    WHERE other.collector_config_id = s.survivor_id
      AND other.bank_account_id = la.bank_account_id
  );--> statement-breakpoint

-- The duplicates go, taking the linked accounts that could not move with them (FK cascade, still in force here)
DELETE FROM "core"."payment_gateway_configs" c
USING pgc_survivors s
WHERE s.organization_id = c.organization_id
  AND c.id <> s.survivor_id;--> statement-breakpoint

-- The survivor is the organization's default collector; a row that never had a label is named after its gateway
UPDATE "core"."payment_gateway_configs"
SET kind = 'ORG',
    is_default = true,
    platform_fee_bps = 0,
    label = coalesce(label, gateway_code)
WHERE kind IS NULL;--> statement-breakpoint

DROP TABLE pgc_survivors;--> statement-breakpoint

-- Every group needs one default: an organization's own rows, and Vritti's rows (no organization). Covers databases
-- that ran the earlier version of this change, whose rows already carry a kind and so were not touched above; the
-- newest row of a group without a default takes the role.
UPDATE "core"."payment_gateway_configs" c
SET is_default = true
WHERE c.id IN (
  SELECT DISTINCT ON (organization_id) id
  FROM "core"."payment_gateway_configs" g
  WHERE NOT EXISTS (
    SELECT 1 FROM "core"."payment_gateway_configs" d
    WHERE d.is_default AND d.organization_id IS NOT DISTINCT FROM g.organization_id
  )
  ORDER BY organization_id, created_at DESC, id DESC
);
