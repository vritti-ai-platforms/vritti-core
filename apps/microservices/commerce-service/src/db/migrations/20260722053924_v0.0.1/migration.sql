CREATE TYPE "vritti_core"."messaging_app" AS ENUM('WHATSAPP', 'TELEGRAM', 'SIGNAL', 'IMO', 'VIBER', 'WECHAT');--> statement-breakpoint
CREATE TABLE "vritti_core"."party_communication_apps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT cast(current_setting('app.org_id') as uuid) NOT NULL,
	"communication_id" uuid NOT NULL,
	"app" "vritti_core"."messaging_app" NOT NULL,
	"handle" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_party_communication_apps_comm_app" UNIQUE("communication_id","app")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."party_communication_apps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_party_communication_apps_comm" ON "vritti_core"."party_communication_apps" ("communication_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."party_communication_apps" ADD CONSTRAINT "party_communication_apps_HpL6A3GLe64m_fkey" FOREIGN KEY ("communication_id") REFERENCES "vritti_core"."party_communications"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."party_communication_apps" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select current_setting('app.org_id', true)::uuid));