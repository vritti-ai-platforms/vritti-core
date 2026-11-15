import { keepPreviousData, type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { LE_PURCHASES } from '@vritti/commerce-permissions/purchases';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { PurchasesTableResponse } from '@/schemas/purchases';
import { getPurchasesTable } from '@/services/legal-entity/purchases.service';
import { PURCHASES_TABLE_KEY } from './keys';

// Fetches the purchases of the site picked in the table's context; self-gates on the view permission
export function usePurchasesTable(
  options?: Omit<UseQueryOptions<PurchasesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(LE_PURCHASES.view);
  return useQuery<PurchasesTableResponse, AxiosError>({
    queryKey: PURCHASES_TABLE_KEY,
    queryFn: getPurchasesTable,
    placeholderData: keepPreviousData,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
