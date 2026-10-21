-- Custom SQL migration file, put your code below! --

-- Every gateway config now names its main account. The id cannot be guessed, so a config without one stops the
-- migration and is named: fill its Provider Merchant ID in Vritti Cloud (the gateway's dialog), then migrate again.
DO $$
DECLARE
  missing text;
BEGIN
  SELECT string_agg(format('%s (%s)', label, id), ', ')
  INTO missing
  FROM "core"."payment_gateway_configs"
  WHERE provider_merchant_id IS NULL OR btrim(provider_merchant_id) = '';

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'payment_gateway_configs without a main account id: %. Fill Provider Merchant ID on each, then migrate again', missing;
  END IF;
END $$;
