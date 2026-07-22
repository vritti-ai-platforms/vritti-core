ALTER TABLE "vritti_core"."party_addresses" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "vritti_core"."party_functions" ADD CONSTRAINT "uq_party_functions_contact_function" UNIQUE("party_contact_id","function");--> statement-breakpoint
ALTER TABLE "vritti_core"."party_functions" ADD CONSTRAINT "uq_party_functions_address_function" UNIQUE("party_address_id","function");--> statement-breakpoint
DROP TYPE "vritti_core"."party_address_type";