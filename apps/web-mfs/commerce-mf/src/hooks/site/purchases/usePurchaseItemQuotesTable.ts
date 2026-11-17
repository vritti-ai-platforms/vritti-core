import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { SITE_PURCHASES } from '@vritti/commerce-permissions/purchases';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { PurchaseItemQuotesTableResponse } from '@/schemas/purchases';
import { getPurchaseItemQuotesTable } from '@/services/site/purchases.service';
import { PURCHASE_ITEM_QUOTES_TABLE_KEY } from './keys';

// Fetches one page of the quotation lines quoting a purchase item; self-gates on the quotations view permission
export function usePurchaseItemQuotesTable(id: string, itemId: string) {
  const { available } = usePermission(SITE_PURCHASES.quotations.view);
  return useQuery<PurchaseItemQuotesTableResponse, AxiosError>({
    queryKey: PURCHASE_ITEM_QUOTES_TABLE_KEY(id, itemId),
    queryFn: () => getPurchaseItemQuotesTable(id, itemId),
    placeholderData: keepPreviousData,
    enabled: available,
  });
}
