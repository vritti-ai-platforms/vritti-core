ALTER TABLE "vritti_core"."offerings" ALTER COLUMN "code" DROP NOT NULL;
--> statement-breakpoint
DROP SEQUENCE IF EXISTS "vritti_core"."item_code_seq";
