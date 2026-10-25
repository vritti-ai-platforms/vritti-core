import { SelectFilter } from '@vritti/quantum-ui/Select';

interface Facet {
  id: string;
  name: string;
  values: { id: string; value: string }[];
}

// One multi-select filter per dimension or attribute, named `<kind>:<id>` so the backend's '<kind>:*' entry resolves
// it — a dot would make the filter form read the name as a nested path
export function facetFilters(kind: 'dimension' | 'attribute', facets: Facet[]) {
  return facets.map((facet) => (
    <SelectFilter
      key={`${kind}:${facet.id}`}
      name={`${kind}:${facet.id}`}
      label={facet.name}
      multiple
      options={facet.values.map((value) => ({ label: value.value, value: value.id }))}
    />
  ));
}
