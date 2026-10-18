import type React from 'react';
import type { VariantFacet } from '@/schemas/variant-facets';

interface VariantFacetsLineProps {
  dimensions: VariantFacet[];
  attributes?: VariantFacet[];
  className?: string;
}

const values = (facets: VariantFacet[]) => facets.flatMap((facet) => facet.values.map((entry) => entry.value));

// Renders what tells one variant from its siblings, always under the offering's name
export const VariantFacetsLine: React.FC<VariantFacetsLineProps> = ({ dimensions, attributes = [], className }) => {
  const parts = [...values(dimensions), ...values(attributes)];
  if (parts.length === 0) return null;
  return <span className={className ?? 'text-muted-foreground text-xs'}>{parts.join(' · ')}</span>;
};
