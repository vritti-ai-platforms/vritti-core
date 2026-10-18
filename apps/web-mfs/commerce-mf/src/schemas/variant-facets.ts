export interface VariantFacetValue {
  code: string;
  value: string;
}

// A variant has no name of its own: its offering supplies the title and these supply what tells it from
// its siblings. Dimensions carry exactly one value each, attributes one or more.
export interface VariantFacet {
  code: string;
  label: string;
  values: VariantFacetValue[];
}
