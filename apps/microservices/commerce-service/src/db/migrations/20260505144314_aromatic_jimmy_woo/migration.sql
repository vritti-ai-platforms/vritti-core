ALTER TABLE "vritti_core"."categories" ADD COLUMN "path_label" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."categories" ADD COLUMN "path" vritti_core.ltree NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."categories" ADD CONSTRAINT "uq_categories_parent_path_label" UNIQUE("parent_id","path_label");--> statement-breakpoint
CREATE INDEX "idx_categories_path" ON "vritti_core"."categories" USING gist ("path");