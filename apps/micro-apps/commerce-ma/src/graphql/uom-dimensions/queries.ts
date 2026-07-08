import { graphql } from '../../gql';

// UOM dimensions list — small/bounded, so a plain array (no relay pagination). Optional search.
export const UOM_DIMENSIONS_QUERY = graphql(`
  query UomDimensions($search: String) {
    uomDimensions(search: $search) {
      ...UomDimensionFields
    }
  }
`);

// Single dimension by id — for the (later) detail screen; served by the by-id cache read redirect.
export const UOM_DIMENSION_QUERY = graphql(`
  query UomDimension($id: ID!) {
    uomDimension(id: $id) {
      ...UomDimensionFields
    }
  }
`);
