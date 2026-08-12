CREATE TABLE "core"."gitea_credentials" (
	"id" integer PRIMARY KEY DEFAULT 1,
	"base_url" text,
	"core_token" text,
	"pull_token" text,
	"rotated_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "gitea_credentials_singleton" CHECK ("id" = 1)
);
