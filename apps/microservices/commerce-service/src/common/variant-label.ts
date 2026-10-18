import type { VariantFacet } from '@/db/schema';

const SEPARATOR = ' · ';

// A variant has no name of its own: what it is comes from its offering, and what tells it from its siblings
// comes from its facets. Readers normally render the two separately — this flattens them for the one case
// that needs a single string, a sale-time snapshot on an order line.
export function variantLabel(offeringName: string, dimensions: VariantFacet[] = [], max = 500): string {
  const values = dimensions.flatMap((facet) => facet.values.map((entry) => entry.value));
  return [offeringName, ...values].join(SEPARATOR).slice(0, max);
}
