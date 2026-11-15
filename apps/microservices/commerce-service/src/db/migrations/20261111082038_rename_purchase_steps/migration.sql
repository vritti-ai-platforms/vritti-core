-- Custom SQL migration file, put your code below! --
ALTER TYPE "commerce"."purchase_step" RENAME VALUE 'ITEMS' TO 'REQUESTING';
--> statement-breakpoint
ALTER TYPE "commerce"."purchase_step" RENAME VALUE 'QUOTATIONS' TO 'QUOTING';
--> statement-breakpoint
ALTER TYPE "commerce"."purchase_step" RENAME VALUE 'FULFILMENT' TO 'PROCURING';
--> statement-breakpoint
UPDATE "commerce"."purchase_events" SET "step_before" = CASE "step_before" WHEN 'ITEMS' THEN 'REQUESTING' WHEN 'QUOTATIONS' THEN 'QUOTING' WHEN 'FULFILMENT' THEN 'PROCURING' ELSE "step_before" END WHERE "step_before" IN ('ITEMS', 'QUOTATIONS', 'FULFILMENT');
--> statement-breakpoint
UPDATE "commerce"."purchase_events" SET "step_after" = CASE "step_after" WHEN 'ITEMS' THEN 'REQUESTING' WHEN 'QUOTATIONS' THEN 'QUOTING' WHEN 'FULFILMENT' THEN 'PROCURING' ELSE "step_after" END WHERE "step_after" IN ('ITEMS', 'QUOTATIONS', 'FULFILMENT');
