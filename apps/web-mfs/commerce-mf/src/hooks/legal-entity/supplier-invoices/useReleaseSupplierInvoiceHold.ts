import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { PURCHASE_ORDERS_KEY } from '@/hooks/legal-entity/purchase-orders/keys';
import type { ReleaseSupplierInvoiceHoldVars } from '@/schemas/supplier-invoices';
import { releaseSupplierInvoiceHold } from '@/services/legal-entity/supplier-invoices.service';
import { LE_SUPPLIER_INVOICES_KEY } from './keys';

// Releases an open hold on an invoice and refreshes the legal entity's invoices and purchase orders
export function useReleaseSupplierInvoiceHold(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ReleaseSupplierInvoiceHoldVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, ReleaseSupplierInvoiceHoldVars>({
    ...options,
    mutationFn: releaseSupplierInvoiceHold,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: LE_SUPPLIER_INVOICES_KEY });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
