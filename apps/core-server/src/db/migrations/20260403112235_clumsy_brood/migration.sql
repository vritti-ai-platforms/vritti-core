ALTER TABLE "vritti_core"."users" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "vritti_core"."users" ADD COLUMN "phone_country" varchar(5);--> statement-breakpoint
ALTER TABLE "vritti_core"."users" ALTER COLUMN "locale" SET DEFAULT 'en';--> statement-breakpoint
ALTER TABLE "vritti_core"."users" ALTER COLUMN "locale" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."users" ALTER COLUMN "timezone" SET DEFAULT 'UTC';--> statement-breakpoint
ALTER TABLE "vritti_core"."users" ALTER COLUMN "timezone" SET NOT NULL;