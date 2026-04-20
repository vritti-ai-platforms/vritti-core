DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'vritti_core'
      AND table_name = 'purchase_orders'
      AND constraint_name = 'uq_purchase_orders_bu_po_number'
  ) THEN
    EXECUTE 'ALTER TABLE "vritti_core"."purchase_orders" DROP CONSTRAINT "uq_purchase_orders_bu_po_number"';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'vritti_core'
      AND table_name = 'purchase_orders'
      AND constraint_name = 'uq_purchase_orders_org_po_number'
  ) THEN
    EXECUTE 'ALTER TABLE "vritti_core"."purchase_orders" ADD CONSTRAINT "uq_purchase_orders_org_po_number" UNIQUE ("organization_id", "po_number")';
  END IF;
END
$$;
