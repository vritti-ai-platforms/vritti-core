import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { LE_PURCHASES } from '@vritti/commerce-permissions/purchases';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { PurchaseSupplierDocuments } from '@/schemas/purchases';
import { getPurchaseDocuments } from '@/services/legal-entity/purchases.service';
import { PURCHASE_DOCUMENTS_KEY } from './keys';

// Fetches the documents of every supplier of a purchase; self-gates on the view permission
export function usePurchaseDocuments(id: string) {
  const { available } = usePermission(LE_PURCHASES.view);
  return useQuery<PurchaseSupplierDocuments[], AxiosError>({
    queryKey: PURCHASE_DOCUMENTS_KEY(id),
    queryFn: () => getPurchaseDocuments(id),
    placeholderData: keepPreviousData,
    enabled: available,
  });
}
