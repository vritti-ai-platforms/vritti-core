DROP POLICY "org_isolation" ON "payments"."payment_transfers";--> statement-breakpoint
ALTER TABLE "payments"."payment_allocations" DROP CONSTRAINT "payment_allocations_transfer_id_payment_transfers_id_fkey";--> statement-breakpoint
DROP TABLE "payments"."payment_transfers";--> statement-breakpoint
ALTER TABLE "payments"."payment_allocations" DROP COLUMN "transfer_id";--> statement-breakpoint
DROP TYPE "payments"."payment_transfer_status";