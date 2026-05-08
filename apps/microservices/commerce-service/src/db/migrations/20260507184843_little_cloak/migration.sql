DROP INDEX "vritti_core"."uq_uom_bu_dim_symbol";--> statement-breakpoint
CREATE UNIQUE INDEX "uq_uom_bu_symbol" ON "vritti_core"."uom" ("business_unit_id","symbol");