// UOM Dimension (mirrors the UomDimension GraphQL type). A dimension groups units (Weight, Volume,
// Count, …): `name` + uppercase `code` + optional `description`. canEdit/canDelete are only populated on
// detail/create/update responses (not the list), so the list cards render actions unconditionally and the
// server enforces (in-use delete → 409).
export interface UomDimension {
  id: string;
  code: string;
  name: string;
  description: string | null;
  canEdit?: boolean | null;
  canDelete?: boolean | null;
  createdAt: string;
  updatedAt: string;
}
