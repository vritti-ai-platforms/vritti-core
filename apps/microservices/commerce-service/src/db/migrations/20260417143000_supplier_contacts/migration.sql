CREATE TABLE "vritti_core"."supplier_contacts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
  "business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
  "supplier_id" uuid NOT NULL,
  "name" varchar(255) NOT NULL,
  "phone" varchar(20),
  "email" varchar(255),
  "designation" varchar(100),
  "notes" varchar(500),
  "is_primary" boolean DEFAULT false NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "vritti_core"."supplier_contacts"
  ADD CONSTRAINT "supplier_contacts_supplier_id_suppliers_id_fk"
  FOREIGN KEY ("supplier_id")
  REFERENCES "vritti_core"."suppliers"("id")
  ON DELETE cascade
  ON UPDATE no action;

CREATE INDEX "idx_supplier_contacts_supplier" ON "vritti_core"."supplier_contacts" USING btree ("supplier_id");

CREATE UNIQUE INDEX "uq_supplier_contacts_primary"
  ON "vritti_core"."supplier_contacts"("supplier_id")
  WHERE "is_primary" = true;

CREATE UNIQUE INDEX "uq_supplier_contacts_supplier_email"
  ON "vritti_core"."supplier_contacts"("supplier_id", "email");

INSERT INTO "vritti_core"."supplier_contacts" (
  "organization_id",
  "business_unit_id",
  "supplier_id",
  "name",
  "phone",
  "email",
  "is_primary",
  "is_active"
)
SELECT
  s."organization_id",
  s."business_unit_id",
  s."id",
  COALESCE(NULLIF(TRIM(s."contact_name"), ''), 'Primary Contact'),
  NULLIF(TRIM(s."phone"), ''),
  NULLIF(TRIM(s."email"), ''),
  true,
  s."is_active"
FROM "vritti_core"."suppliers" s;
