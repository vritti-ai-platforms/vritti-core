import type { Reference } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { CREATE_INVENTORY_ITEM } from '../../graphql/inventory-items';

type ItemEdge = { node: Reference };
type ItemConnection = { edges?: ItemEdge[]; pageInfo?: unknown };

// CREATE — prepend the created item's edge into the cached feed connection(s) so the list updates with
// ZERO refetch (relayStylePagination owns pagination; we only patch membership). The mutation returns the
// full entity, which Apollo auto-normalizes by id.
export function useCreateInventoryItem() {
  return useMutation(CREATE_INVENTORY_ITEM, {
    update(cache, { data }) {
      const created = data?.createInventoryItem;
      if (!created) return;
      cache.modify({
        fields: {
          inventoryItems(existing, { toReference, readField }) {
            const conn = (existing ?? {}) as ItemConnection;
            const edges = conn.edges ?? [];
            if (edges.some((edge) => readField('id', edge.node) === created.id)) return existing;
            const node = toReference(created);
            if (!node) return existing;
            return { ...conn, edges: [{ __typename: 'InventoryItemEdge', cursor: '', node }, ...edges] };
          },
        },
      });
    },
  });
}
