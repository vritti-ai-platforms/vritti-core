ALTER TABLE "core"."media" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "core"."media" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "core"."media" ALTER COLUMN "organization_id" SET DEFAULT cast(current_setting('app.org_id') as uuid);--> statement-breakpoint
ALTER TABLE "core"."media" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
DROP INDEX "core"."idx_media_entity";--> statement-breakpoint
CREATE INDEX "idx_media_entity" ON "core"."media" ("organization_id","entity_type","entity_id");--> statement-breakpoint
DROP INDEX "core"."idx_media_checksum";--> statement-breakpoint
CREATE INDEX "idx_media_checksum" ON "core"."media" ("organization_id","checksum");--> statement-breakpoint
DROP INDEX "core"."idx_media_storage_key";--> statement-breakpoint
CREATE INDEX "idx_media_storage_key" ON "core"."media" ("organization_id","storage_key");--> statement-breakpoint
CREATE INDEX "media_organization_id_idx" ON "core"."media" ("organization_id");--> statement-breakpoint
ALTER TABLE "core"."media" ADD CONSTRAINT "media_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."media" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));