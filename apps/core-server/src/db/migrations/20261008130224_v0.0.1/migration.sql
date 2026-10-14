CREATE TYPE "core"."payment_linked_account_status" AS ENUM('PENDING', 'IN_REVIEW', 'ACTION_REQUIRED', 'ACTIVE', 'SUSPENDED', 'FAILED');--> statement-breakpoint
CREATE TABLE "core"."payment_linked_accounts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"collector_config_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"provider_account_id" varchar(100),
	"provider_data" jsonb DEFAULT '{}' NOT NULL,
	"status" "core"."payment_linked_account_status" DEFAULT 'PENDING'::"core"."payment_linked_account_status" NOT NULL,
	"transfers_allowed_at" timestamp,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_payment_linked_accounts_collector_bank" UNIQUE("collector_config_id","bank_account_id")
);
--> statement-breakpoint
ALTER TABLE "core"."payment_linked_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "core"."payment_gateway_configs" ADD COLUMN "split_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_payment_linked_accounts_collector" ON "core"."payment_linked_accounts" ("collector_config_id");--> statement-breakpoint
CREATE INDEX "idx_payment_linked_accounts_bank_account" ON "core"."payment_linked_accounts" ("bank_account_id");--> statement-breakpoint
ALTER TABLE "core"."payment_linked_accounts" ADD CONSTRAINT "payment_linked_accounts_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "core"."organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."payment_linked_accounts" ADD CONSTRAINT "payment_linked_accounts_YM0xWIruo2IO_fkey" FOREIGN KEY ("collector_config_id") REFERENCES "core"."payment_gateway_configs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "core"."payment_linked_accounts" ADD CONSTRAINT "payment_linked_accounts_bank_account_id_bank_accounts_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "core"."bank_accounts"("id") ON DELETE RESTRICT;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "core"."payment_linked_accounts" AS PERMISSIVE FOR ALL TO public USING (organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid));