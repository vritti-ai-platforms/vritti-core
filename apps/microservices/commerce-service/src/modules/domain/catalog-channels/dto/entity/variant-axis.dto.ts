import type { VariantSiblingRow } from '../../repositories/catalog-channels.repository';
import type { StorefrontListingDto } from './storefront-listing.dto';

export class VariantOptionDto {
  code: string;
  name: string;
  selected: boolean;
  variantCode: string | null;
}

export class VariantAxisDto {
  code: string;
  name: string;
  sortOrder: number;
  options: VariantOptionDto[];
}

export class CatalogListingDetailDto {
  listing: StorefrontListingDto;
  axes: VariantAxisDto[];
}

type Sibling = { variantCode: string; values: Map<string, string> };

// Turns the flat (variant, dimension) rows into the axes a product page switches on.
export function buildVariantAxes(rows: VariantSiblingRow[], currentVariantId: string): VariantAxisDto[] {
  const siblings = new Map<string, Sibling>();
  const axes = new Map<string, VariantAxisDto & { seen: Map<string, { name: string; sortOrder: number }> }>();

  for (const row of rows) {
    let sibling = siblings.get(row.variantId);
    if (!sibling) {
      sibling = { variantCode: row.code, values: new Map() };
      siblings.set(row.variantId, sibling);
    }
    sibling.values.set(row.dimensionCode, row.valueCode);

    let axis = axes.get(row.dimensionCode);
    if (!axis) {
      axis = {
        code: row.dimensionCode,
        name: row.dimensionName,
        sortOrder: row.dimensionSortOrder,
        options: [],
        seen: new Map(),
      };
      axes.set(row.dimensionCode, axis);
    }
    if (!axis.seen.has(row.valueCode)) {
      axis.seen.set(row.valueCode, { name: row.valueName, sortOrder: row.valueSortOrder });
    }
  }

  const current = siblings.get(currentVariantId);
  if (!current) return [];

  return [...axes.values()]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code))
    .map((axis) => ({
      code: axis.code,
      name: axis.name,
      sortOrder: axis.sortOrder,
      options: [...axis.seen.entries()]
        .sort(([, a], [, b]) => a.sortOrder - b.sortOrder)
        .map(([valueCode, value]) => {
          const target = [...siblings.values()].find(
            (sibling) =>
              sibling.values.get(axis.code) === valueCode &&
              [...current.values].every(([code, held]) => code === axis.code || sibling.values.get(code) === held),
          );
          return {
            code: valueCode,
            name: value.name,
            selected: current.values.get(axis.code) === valueCode,
            variantCode: target?.variantCode ?? null,
          };
        }),
    }));
}
