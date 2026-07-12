import { useMutation } from '@apollo/client/react';
import { UPDATE_TAX_GROUP } from '../../../graphql/tax-groups';

// UPDATE — the mutation returns the full entity (server re-reads it), so Apollo auto-merges by id; every
// view holding this tax group updates with no surgery and no refetch.
export function useUpdateTaxGroup() {
  return useMutation(UPDATE_TAX_GROUP);
}
