import type { VariantSiblingRow } from '../../repositories/catalog-channels.repository';
import type { StorefrontListingDto } from './storefront-listing.dto';

export class VariantOptionDto {
  code: string;
  name: string;
  selected: boolean;
  // The sibling this option leads to, holding every other axis where it is. Null when that
  // combination is not sold here — the option still renders, disabled, because a switcher that
  // hides unavailable sizes makes the range look smaller than it is.
  sku: string | null;
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

type Sibling = { sku: string; values: Map<string, string> };

/**
 * Turns the flat (variant, dimension) rows into the axes a product page switches on.
 *
 * An option's target is resolved by **holding every other axis fixed and swapping this one** — so
 * from 250g · Dark Chocolate, the 750g option leads to 750g · Dark Chocolate, not to whichever 750g
 * happens to exist. That is the whole reason this cannot be built from a list of SKUs: the answer
 * depends on where the shopper is standing.
 *
 * Only values carried by a sellable sibling appear at all. A flavour the shop does not stock is not
 * a disabled option, it is not an option — the same rule the filter rail follows.
 */
export function buildVariantAxes(rows: VariantSiblingRow[], currentVariantId: string): VariantAxisDto[] {
  const siblings = new Map<string, Sibling>();
  const axes = new Map<string, VariantAxisDto & { seen: Map<string, { name: string; sortOrder: number }> }>();

  for (const row of rows) {
    let sibling = siblings.get(row.variantId);
    if (!sibling) {
      sibling = { sku: row.sku, values: new Map() };
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
            sku: target?.sku ?? null,
          };
        }),
    }));
}
