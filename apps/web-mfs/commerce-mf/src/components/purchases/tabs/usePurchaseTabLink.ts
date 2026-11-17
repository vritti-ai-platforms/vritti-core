import { useQueryClient } from '@tanstack/react-query';
import { setTableContext } from '@vritti/quantum-ui/DataTable';
import type { FilterCondition } from '@vritti/quantum-ui/types/conditions';
import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { PurchaseDetailTable, PurchasesBinding } from '../bindings';

// Opens one of the purchase's tabs narrowed to a filter: the table's saved context is written first and its cached
// rows dropped, so the tab loads that context instead of the one it showed last
export function usePurchaseTabLink(binding: PurchasesBinding, purchaseId: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { purchaseSlug } = useParams();

  return useCallback(
    async (table: PurchaseDetailTable, context: FilterCondition[]) => {
      await setTableContext(binding.purchaseTableSlug(purchaseId, table), context);
      queryClient.removeQueries({ queryKey: binding.purchaseTableKeys[table](purchaseId) });
      navigate(`../${purchaseSlug}/${table}`);
    },
    [binding, purchaseId, purchaseSlug, navigate, queryClient],
  );
}
