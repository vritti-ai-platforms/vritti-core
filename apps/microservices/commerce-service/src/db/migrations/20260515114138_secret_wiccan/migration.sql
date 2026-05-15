ALTER TABLE "vritti_core"."inventory_ledger" DROP CONSTRAINT IF EXISTS "inventory_ledger_batch_id_inventory_item_quants_id_fkey";--> statement-breakpoint
DROP INDEX IF EXISTS "vritti_core"."idx_inventory_ledger_batch";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_ledger" DROP COLUMN IF EXISTS "batch_id";