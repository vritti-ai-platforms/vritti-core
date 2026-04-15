DO $$
BEGIN
  CREATE TYPE vritti_core.inventory_ledger_reference_type AS ENUM (
    'GOODS_RECEIPT',
    'STOCK_ADJUSTMENT',
    'CONVERSION',
    'STOCK_TRANSFER',
    'ORDER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE vritti_core.inventory_ledger
  ALTER COLUMN reference_type
  TYPE vritti_core.inventory_ledger_reference_type
  USING (
    CASE
      WHEN reference_type IS NULL THEN NULL
      ELSE reference_type::vritti_core.inventory_ledger_reference_type
    END
  );
