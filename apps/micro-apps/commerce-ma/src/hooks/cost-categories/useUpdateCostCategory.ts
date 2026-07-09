import { useMutation } from '@apollo/client/react';
import { UPDATE_COST_CATEGORY } from '../../graphql/cost-categories';

// UPDATE — the mutation returns the full entity (server re-reads it), so Apollo auto-merges by id; every
// view holding this category updates with no surgery and no refetch. Rename + activate/deactivate both
// flow through here.
export function useUpdateCostCategory() {
  return useMutation(UPDATE_COST_CATEGORY);
}
