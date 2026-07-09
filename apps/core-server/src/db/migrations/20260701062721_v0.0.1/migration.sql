ALTER INDEX "vritti_core"."user_role_assignments_user_role_bu_unique" RENAME TO "user_role_assignments_user_bu_unique";--> statement-breakpoint
DROP INDEX "vritti_core"."user_role_assignments_user_bu_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "user_role_assignments_user_bu_unique" ON "vritti_core"."user_role_assignments" ("user_id","business_unit_id");