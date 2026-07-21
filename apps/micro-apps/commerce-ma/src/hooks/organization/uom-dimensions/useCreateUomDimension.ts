import { useMutation } from '@apollo/client/react';
import { CREATE_UOM_DIMENSION, UOM_DIMENSIONS_QUERY } from '../../../graphql/uom-dimensions';

// CREATE — prepend the returned entity into the cached (unfiltered) dimension list (no refetch). An
// active search variant revalidates via cache-and-network on its next view.
export function useCreateUomDimension() {
  return useMutation(CREATE_UOM_DIMENSION, {
    update(cache, { data }) {
      const created = data?.createUomDimension;
      if (!created) return;
      cache.updateQuery({ query: UOM_DIMENSIONS_QUERY, variables: { search: undefined } }, (prev) =>
        prev ? { uomDimensions: [created, ...prev.uomDimensions] } : prev,
      );
    },
  });
}
