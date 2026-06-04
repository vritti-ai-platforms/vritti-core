-- Rename enum value POS → RESERVED_STORAGE in-place (PG10+).
-- All existing rows with location_role = 'POS' automatically get the new label;
-- no data conversion needed, no destructive drop-and-recreate.
ALTER TYPE "vritti_core"."location_role" RENAME VALUE 'POS' TO 'RESERVED_STORAGE';
