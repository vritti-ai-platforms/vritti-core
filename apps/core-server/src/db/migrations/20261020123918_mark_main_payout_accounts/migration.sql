-- Custom SQL migration file, put your code below! --

-- A payout account that names its gateway config's main account keeps its share there; mark the ones that exist
UPDATE "core"."payout_accounts" pa
SET is_main_account = (pa.gateway_account_id = c.gateway_account_id)
FROM "core"."payment_gateway_configs" c
WHERE c.id = pa.payment_gateway_config_id;
