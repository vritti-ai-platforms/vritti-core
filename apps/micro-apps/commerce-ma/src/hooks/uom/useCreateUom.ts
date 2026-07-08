import { useMutation } from '@apollo/client/react';
import { prependEdgeToConnection } from '@vritti/quantum-ui-native/apollo';
import { CREATE_UOM } from '../../graphql/uom';

// CREATE — prepend the created unit's edge into THIS dimension's cached feed connection (relayStylePagination
// owns pagination; we only patch membership). The matchesVariant guard keeps a new unit out of other
// dimensions' cached feeds (the connection is keyed by dimensionId). Returns the full entity → Apollo
// normalizes by id. No refetch.
export function useCreateUom(dimensionId: string) {
  return useMutation(CREATE_UOM, {
    update(cache, { data }) {
      const created = data?.createUom;
      if (!created) return;
      prependEdgeToConnection({
        cache,
        connectionField: 'uomsFeed',
        entity: created,
        edgeTypename: 'UomEdge',
        matchesVariant: (args) => args?.dimensionId === dimensionId,
      });
    },
  });
}
