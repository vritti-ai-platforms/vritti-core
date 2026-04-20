DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'vritti_core' AND table_name = 'items' AND constraint_name = 'uq_items_bu_code'
  ) THEN
    EXECUTE 'ALTER TABLE "vritti_core"."items" DROP CONSTRAINT "uq_items_bu_code"';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'vritti_core' AND table_name = 'items' AND constraint_name = 'uq_items_org_code'
  ) THEN
    EXECUTE 'ALTER TABLE "vritti_core"."items" ADD CONSTRAINT "uq_items_org_code" UNIQUE ("organization_id", "code")';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'vritti_core' AND table_name = 'orders' AND constraint_name = 'uq_orders_bu_number'
  ) THEN
    EXECUTE 'ALTER TABLE "vritti_core"."orders" DROP CONSTRAINT "uq_orders_bu_number"';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'vritti_core' AND table_name = 'orders' AND constraint_name = 'uq_orders_org_number'
  ) THEN
    EXECUTE 'ALTER TABLE "vritti_core"."orders" ADD CONSTRAINT "uq_orders_org_number" UNIQUE ("organization_id", "order_number")';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'vritti_core' AND table_name = 'purchase_orders' AND constraint_name = 'uq_purchase_orders_bu_po_number'
  ) THEN
    EXECUTE 'ALTER TABLE "vritti_core"."purchase_orders" DROP CONSTRAINT "uq_purchase_orders_bu_po_number"';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'vritti_core' AND table_name = 'purchase_orders' AND constraint_name = 'uq_purchase_orders_org_po_number'
  ) THEN
    EXECUTE 'ALTER TABLE "vritti_core"."purchase_orders" ADD CONSTRAINT "uq_purchase_orders_org_po_number" UNIQUE ("organization_id", "po_number")';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'vritti_core' AND table_name = 'goods_receipts' AND constraint_name = 'uq_goods_receipts_bu_gr_number'
  ) THEN
    EXECUTE 'ALTER TABLE "vritti_core"."goods_receipts" DROP CONSTRAINT "uq_goods_receipts_bu_gr_number"';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'vritti_core' AND table_name = 'goods_receipts' AND constraint_name = 'uq_goods_receipts_org_gr_number'
  ) THEN
    EXECUTE 'ALTER TABLE "vritti_core"."goods_receipts" ADD CONSTRAINT "uq_goods_receipts_org_gr_number" UNIQUE ("organization_id", "gr_number")';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'vritti_core' AND table_name = 'stock_adjustments' AND constraint_name = 'uq_stock_adjustments_org_code'
  ) THEN
    EXECUTE 'ALTER TABLE "vritti_core"."stock_adjustments" ADD CONSTRAINT "uq_stock_adjustments_org_code" UNIQUE ("organization_id", "code")';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'vritti_core' AND table_name = 'inventory_item_batches' AND constraint_name = 'uq_inventory_item_batches_org_batch_number'
  ) THEN
    EXECUTE 'ALTER TABLE "vritti_core"."inventory_item_batches" ADD CONSTRAINT "uq_inventory_item_batches_org_batch_number" UNIQUE ("organization_id", "batch_number")';
  END IF;
END
$$;
