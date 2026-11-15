import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { PURCHASE_ORDERS_KEY } from '@/hooks/legal-entity/purchase-orders/keys';
import { PURCHASES_KEY } from '@/hooks/legal-entity/purchases/keys';
import type { SupplierInvoiceRef } from '@/schemas/supplier-invoices';
import { postSupplierInvoice } from '@/services/legal-entity/supplier-invoices.service';
import { LE_SUPPLIER_INVOICES_KEY } from './keys';

// Posts a draft invoice and refreshes the legal entity's invoices and purchase orders
export function usePostSupplierInvoice(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SupplierInvoiceRef>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, SupplierInvoiceRef>({
    ...options,
    mutationFn: postSupplierInvoice,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: LE_SUPPLIER_INVOICES_KEY });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY });
      queryClient.invalidateQueries({ queryKey: PURCHASES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
