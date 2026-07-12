import { useMutation } from '@apollo/client/react';
import { UPDATE_UOM } from '../../../graphql/uom';

// UPDATE — the mutation returns the full entity, so Apollo auto-merges by id (no surgery, no refetch).
export function useUpdateUom() {
  return useMutation(UPDATE_UOM);
}
