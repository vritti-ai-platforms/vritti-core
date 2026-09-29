ALTER TABLE "commerce"."carts" DROP CONSTRAINT "carts_channel_id_catalog_channels_id_fkey";--> statement-breakpoint
ALTER TABLE "commerce"."carts" DROP COLUMN "channel_id";