-- Drop unused created_by column from purchase_orders.
-- Audit info is captured via RLS context (app.org_id, app.bu_id) + the row's createdAt timestamp.

ALTER TABLE "vritti_core"."purchase_orders" DROP COLUMN IF EXISTS "created_by";
