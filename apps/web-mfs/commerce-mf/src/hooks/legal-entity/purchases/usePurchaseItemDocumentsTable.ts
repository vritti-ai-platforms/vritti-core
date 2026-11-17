import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { LE_PURCHASES } from '@vritti/commerce-permissions/purchases';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { PurchaseItemDocumentsTableResponse } from '@/schemas/purchases';
import { getPurchaseItemDocumentsTable } from '@/services/legal-entity/purchases.service';
import { PURCHASE_ITEM_DOCUMENTS_TABLE_KEY } from './keys';

// Fetches one page of the document lines that move a purchase item; self-gates on the view permission
export function usePurchaseItemDocumentsTable(id: string, itemId: string) {
  const { available } = usePermission(LE_PURCHASES.view);
  return useQuery<PurchaseItemDocumentsTableResponse, AxiosError>({
    queryKey: PURCHASE_ITEM_DOCUMENTS_TABLE_KEY(id, itemId),
    queryFn: () => getPurchaseItemDocumentsTable(id, itemId),
    placeholderData: keepPreviousData,
    enabled: available,
  });
}
