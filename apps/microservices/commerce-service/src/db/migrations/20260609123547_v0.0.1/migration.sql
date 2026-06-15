DROP POLICY "org_isolation" ON "vritti_core"."bom";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."bom";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."bom";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."bom";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."bom";--> statement-breakpoint
DROP POLICY "org_isolation" ON "vritti_core"."conversions";--> statement-breakpoint
DROP POLICY "bu_ancestor_read" ON "vritti_core"."conversions";--> statement-breakpoint
DROP POLICY "bu_write" ON "vritti_core"."conversions";--> statement-breakpoint
DROP POLICY "bu_update" ON "vritti_core"."conversions";--> statement-breakpoint
DROP POLICY "bu_delete" ON "vritti_core"."conversions";--> statement-breakpoint
ALTER TABLE "vritti_core"."bom_lines" DROP CONSTRAINT "bom_lines_bom_id_bom_id_fkey";--> statement-breakpoint
ALTER TABLE "vritti_core"."conversion_inputs" DROP CONSTRAINT "conversion_inputs_conversion_id_conversions_id_fkey";--> statement-breakpoint
ALTER TABLE "vritti_core"."conversion_outputs" DROP CONSTRAINT "conversion_outputs_conversion_id_conversions_id_fkey";--> statement-breakpoint
ALTER TABLE "vritti_core"."conversions" DROP CONSTRAINT "conversions_bom_id_bom_id_fkey";--> statement-breakpoint
DROP TABLE "vritti_core"."bom";--> statement-breakpoint
DROP TABLE "vritti_core"."bom_lines";--> statement-breakpoint
DROP TABLE "vritti_core"."conversion_inputs";--> statement-breakpoint
DROP TABLE "vritti_core"."conversion_outputs";--> statement-breakpoint
DROP TABLE "vritti_core"."conversions";