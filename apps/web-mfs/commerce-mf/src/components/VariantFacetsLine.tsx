import type React from 'react';
import type { VariantFacet } from '@/schemas/variant-facets';

interface VariantFacetsLineProps {
  dimensions: VariantFacet[];
  // Shown after the dimensions, dimmer. Usually left out in a table, where the row is already narrow.
  attributes?: VariantFacet[];
  className?: string;
}

const values = (facets: VariantFacet[]) => facets.flatMap((facet) => facet.values.map((entry) => entry.value));

// What tells one variant from its siblings. A variant has no name of its own, so this always reads under the
// offering's name rather than instead of it.
export const VariantFacetsLine: React.FC<VariantFacetsLineProps> = ({ dimensions, attributes = [], className }) => {
  const parts = [...values(dimensions), ...values(attributes)];
  if (parts.length === 0) return null;
  return <span className={className ?? 'text-muted-foreground text-xs'}>{parts.join(' · ')}</span>;
};
