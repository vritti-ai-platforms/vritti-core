import type { Reference } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { DELETE_INVENTORY_ITEM } from '../../graphql/inventory-items';

type ItemEdge = { node: Reference };
type ItemConnection = { edges?: ItemEdge[]; pageInfo?: unknown };

// DELETE — confirm-first (no optimistic). Drop the edge from the cached connection(s) and evict the
// record so it disappears from every list at once, with ZERO refetch. The client already holds the id.
export function useDeleteInventoryItem() {
  return useMutation(DELETE_INVENTORY_ITEM, {
    update(cache, _result, { variables }) {
      const id = variables?.id;
      if (!id) return;
      cache.modify({
        fields: {
          inventoryItems(existing, { readField }) {
            const conn = (existing ?? {}) as ItemConnection;
            if (!conn.edges) return existing;
            return { ...conn, edges: conn.edges.filter((edge) => readField('id', edge.node) !== id) };
          },
        },
      });
      cache.evict({ id: cache.identify({ __typename: 'InventoryItem', id }) });
      cache.gc();
    },
  });
}
