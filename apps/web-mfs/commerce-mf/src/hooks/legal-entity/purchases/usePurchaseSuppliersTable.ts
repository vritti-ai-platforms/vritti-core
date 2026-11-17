import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { LE_PURCHASES } from '@vritti/commerce-permissions/purchases';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { PurchaseLegsTableResponse } from '@/schemas/purchases';
import { getPurchaseSuppliersTable } from '@/services/legal-entity/purchases.service';
import { PURCHASE_SUPPLIERS_TABLE_KEY } from './keys';

// Fetches one page of a purchase's suppliers; self-gates on the view permission
export function usePurchaseSuppliersTable(id: string) {
  const { available } = usePermission(LE_PURCHASES.view);
  return useQuery<PurchaseLegsTableResponse, AxiosError>({
    queryKey: PURCHASE_SUPPLIERS_TABLE_KEY(id),
    queryFn: () => getPurchaseSuppliersTable(id),
    placeholderData: keepPreviousData,
    enabled: available,
  });
}
