import { graphql } from '../../gql';

// Tax groups list — small/bounded, so a plain array (no relay pagination). Optional search by name.
export const TAX_GROUPS_QUERY = graphql(`
  query TaxGroups($search: String) {
    taxGroups(search: $search) {
      ...TaxGroupFields
    }
  }
`);
