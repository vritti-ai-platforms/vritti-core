CREATE TYPE "core"."webhook_delivery_status" AS ENUM('PENDING', 'DELIVERED', 'FAILED');--> statement-breakpoint
CREATE TABLE "core"."app_webhook_endpoints" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"app_id" uuid NOT NULL CONSTRAINT "uq_app_webhook_endpoints_app" UNIQUE,
	"url" varchar(2000) NOT NULL,
	"events" text[] DEFAULT ARRAY['payment_intent.succeeded', 'payment_intent.payment_failed', 'payment_intent.expired']::text[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "core"."app_webhook_endpoints" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "core"."webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"app_id" uuid NOT NULL,
	"endpoint_id" uuid NOT NULL,
	"event_id" varchar(100) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "core"."webhook_delivery_status" DEFAULT 'PENDING'::"core"."webhook_delivery_status" NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_status_code" integer,
	"last_error" text,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_webhook_deliveries_endpoint_event" UNIQUE("endpoint_id","event_id")
);
--> statement-breakpoint
ALTER TABLE "core"."webhook_deliveries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_app_webhook_endpoints_org" ON "core"."app_webhook_endpoints" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_deliveries_status_next_attempt" ON "core"."webhook_deliveries" ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "idx_webhook_deliveries_app" ON "core"."webhook_deliveries" ("app_id");--> statement-breakpoint
ALTER TABLE "core"."app_webhook_endpoints" ADD CONSTRAINT "app_webhook_endpoints_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."app_webhook_endpoints" ADD CONSTRAINT "app_webhook_endpoints_app_id_apps_id_fkey" FOREIGN KEY ("app_id") REFERENCES "core"."apps"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_app_id_apps_id_fkey" FOREIGN KEY ("app_id") REFERENCES "core"."apps"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_endpoint_id_app_webhook_endpoints_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "core"."app_webhook_endpoints"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."app_webhook_endpoints" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."webhook_deliveries" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));