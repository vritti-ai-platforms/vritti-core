// A unit of measure within a dimension (mirrors the Uom GraphQL type). A unit is a BASE unit when
// baseUnitId is null, otherwise DERIVED. Conversion: `uomQty` units of THIS unit equal `baseUomQty` units
// of its base (e.g. 1000 g = 1 kg → uomQty=1000, baseUomQty=1).
export interface Uom {
  id: string;
  dimensionId: string;
  name: string;
  symbol: string;
  baseUnitId: string | null;
  baseUnitSymbol: string | null;
  baseUomQty: number;
  uomQty: number;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
}
