ALTER TABLE "vritti_core"."inventory_ledger" RENAME TO "inventory_item_ledger";--> statement-breakpoint
ALTER TYPE "vritti_core"."inventory_ledger_type" RENAME TO "inventory_item_ledger_type";--> statement-breakpoint
ALTER TYPE "vritti_core"."inventory_ledger_reference_type" RENAME TO "inventory_item_ledger_reference_type";--> statement-breakpoint
ALTER INDEX "vritti_core"."idx_inventory_ledger_item" RENAME TO "idx_inventory_item_ledger_item";--> statement-breakpoint
ALTER INDEX "vritti_core"."idx_inventory_ledger_bu" RENAME TO "idx_inventory_item_ledger_bu";--> statement-breakpoint
ALTER INDEX "vritti_core"."idx_inventory_ledger_ref" RENAME TO "idx_inventory_item_ledger_ref";--> statement-breakpoint
ALTER INDEX "vritti_core"."idx_inventory_ledger_created" RENAME TO "idx_inventory_item_ledger_created";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_ledger" RENAME CONSTRAINT "inventory_ledger_inventory_item_id_inventory_items_id_fkey" TO "inventory_item_ledger_inventory_item_id_inventory_items_id_fkey";
