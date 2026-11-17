import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { LE_PURCHASES } from '@vritti/commerce-permissions/purchases';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { PurchaseLegCount } from '@/schemas/purchases';
import { getPurchaseSupplierCounts } from '@/services/legal-entity/purchases.service';
import { PURCHASE_SUPPLIER_COUNTS_KEY } from './keys';

// Counts a purchase's suppliers and their lines by step and status; self-gates on the view permission
export function usePurchaseSupplierCounts(id: string) {
  const { available } = usePermission(LE_PURCHASES.view);
  return useQuery<PurchaseLegCount[], AxiosError>({
    queryKey: PURCHASE_SUPPLIER_COUNTS_KEY(id),
    queryFn: () => getPurchaseSupplierCounts(id),
    placeholderData: keepPreviousData,
    enabled: available,
  });
}
