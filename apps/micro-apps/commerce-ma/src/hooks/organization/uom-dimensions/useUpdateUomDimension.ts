import { useMutation } from '@apollo/client/react';
import { UPDATE_UOM_DIMENSION } from '../../../graphql/uom-dimensions';

// UPDATE — the mutation returns the full entity, so Apollo auto-merges by id; every view holding this
// dimension updates with no surgery and no refetch.
export function useUpdateUomDimension() {
  return useMutation(UPDATE_UOM_DIMENSION);
}
