export interface VariantFacetValue {
  code: string;
  value: string;
}

export interface VariantFacet {
  code: string;
  label: string;
  values: VariantFacetValue[];
}
