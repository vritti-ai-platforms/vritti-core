import type { VariantFacet } from '@/db/schema';

const SEPARATOR = ' · ';

// Flattens an offering's name and a variant's facets into the one string an order line snapshots
export function variantLabel(offeringName: string, dimensions: VariantFacet[] = [], max = 500): string {
  const values = dimensions.flatMap((facet) => facet.values.map((entry) => entry.value));
  return [offeringName, ...values].join(SEPARATOR).slice(0, max);
}
