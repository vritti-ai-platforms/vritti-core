import { graphql } from '../../gql';

// Shared field set — reused by the list query and the create/update mutations so cached tax groups
// identity-merge by id. Embeds the nested tax rates (create/update replace the whole set server-side).
export const TaxGroupFieldsFragment = graphql(`
  fragment TaxGroupFields on TaxGroup {
    id
    name
    isActive
    canDelete
    taxRates {
      id
      name
      rate
      sortOrder
    }
  }
`);
