ALTER TYPE "core"."org_plan" RENAME VALUE 'free' TO 'FREE';
--> statement-breakpoint
ALTER TYPE "core"."org_plan" RENAME VALUE 'pro' TO 'PRO';
--> statement-breakpoint
ALTER TYPE "core"."org_plan" RENAME VALUE 'enterprise' TO 'ENTERPRISE';
--> statement-breakpoint
ALTER TYPE "core"."media_status" RENAME VALUE 'pending' TO 'PENDING';
--> statement-breakpoint
ALTER TYPE "core"."media_status" RENAME VALUE 'ready' TO 'READY';
--> statement-breakpoint
ALTER TYPE "core"."media_status" RENAME VALUE 'failed' TO 'FAILED';
--> statement-breakpoint
ALTER TYPE "core"."media_status" RENAME VALUE 'deleted' TO 'DELETED';
--> statement-breakpoint
UPDATE "core"."table_views" AS tv
SET "state" = jsonb_set(tv."state", '{filters}', (
  SELECT jsonb_agg(
    CASE WHEN f ->> 'field' = 'tracking' THEN jsonb_set(f, '{value}', CASE jsonb_typeof(f -> 'value')
      WHEN 'array' THEN COALESCE((SELECT jsonb_agg(upper(v)) FROM jsonb_array_elements_text(f -> 'value') AS v), '[]'::jsonb)
      WHEN 'string' THEN to_jsonb(upper(f ->> 'value'))
      ELSE f -> 'value' END)
    ELSE f END
    ORDER BY ord)
  FROM jsonb_array_elements(tv."state" -> 'filters') WITH ORDINALITY AS t(f, ord)
))
WHERE tv."state" -> 'filters' @> '[{"field": "tracking"}]';
