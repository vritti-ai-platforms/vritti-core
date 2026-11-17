import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { SITE_PURCHASES } from '@vritti/commerce-permissions/purchases';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { PurchaseQuotationsTableResponse } from '@/schemas/purchases';
import { getPurchaseQuotationsTable } from '@/services/site/purchases.service';
import { PURCHASE_QUOTATIONS_TABLE_KEY } from './keys';

// Fetches one page of the quotations linked to a purchase; self-gates on the view permission
export function usePurchaseQuotationsTable(id: string) {
  const { available } = usePermission(SITE_PURCHASES.quotations.view);
  return useQuery<PurchaseQuotationsTableResponse, AxiosError>({
    queryKey: PURCHASE_QUOTATIONS_TABLE_KEY(id),
    queryFn: () => getPurchaseQuotationsTable(id),
    placeholderData: keepPreviousData,
    enabled: available,
  });
}
