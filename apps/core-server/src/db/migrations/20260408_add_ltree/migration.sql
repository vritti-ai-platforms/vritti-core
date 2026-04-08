-- Enable ltree extension
CREATE EXTENSION IF NOT EXISTS ltree SCHEMA vritti_core;

-- Convert existing paths from '/uuid1/uuid2' text format to 'uuid1_san.uuid2_san' ltree format
-- First update the data, replacing / with . and - with _
UPDATE "vritti_core"."business_units"
SET path = regexp_replace(
  regexp_replace(
    trim(both '/' from COALESCE(path, '')),
    '/', '.', 'g'
  ),
  '-', '_', 'g'
);

-- Alter column type from text to ltree
ALTER TABLE "vritti_core"."business_units" ALTER COLUMN "path" TYPE ltree USING path::ltree;

-- Drop old B-tree index if exists
DROP INDEX IF EXISTS "vritti_core"."business_units_path_idx";

-- Add GiST index for ltree operations
CREATE INDEX "idx_bu_path_gist" ON "vritti_core"."business_units" USING gist("path");
