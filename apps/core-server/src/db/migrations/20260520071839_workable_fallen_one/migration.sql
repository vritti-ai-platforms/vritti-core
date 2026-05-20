ALTER TABLE "vritti_core"."organizations" ALTER COLUMN "subdomain" SET DATA TYPE varchar(100) USING "subdomain"::varchar(100);--> statement-breakpoint
ALTER TABLE "vritti_core"."table_views" ALTER COLUMN "name" SET DATA TYPE varchar(100) USING "name"::varchar(100);--> statement-breakpoint
ALTER TABLE "vritti_core"."business_units" ALTER COLUMN "code" SET DATA TYPE varchar(100) USING "code"::varchar(100);--> statement-breakpoint
ALTER POLICY "org_isolation" ON "vritti_core"."business_units" TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));