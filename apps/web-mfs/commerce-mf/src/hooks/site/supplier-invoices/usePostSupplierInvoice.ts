import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { PURCHASE_ORDERS_KEY } from '@/hooks/site/purchase-orders/keys';
import { PURCHASES_KEY } from '@/hooks/site/purchases/keys';
import type { SupplierInvoiceRef } from '@/schemas/supplier-invoices';
import { postSupplierInvoice } from '@/services/site/supplier-invoices.service';
import { SITE_SUPPLIER_INVOICES_KEY } from './keys';

// Posts a draft invoice through its supplier and refreshes the site's invoices and purchase orders
export function usePostSupplierInvoice(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SupplierInvoiceRef>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, SupplierInvoiceRef>({
    ...options,
    mutationFn: postSupplierInvoice,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIER_INVOICES_KEY });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY });
      queryClient.invalidateQueries({ queryKey: PURCHASES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
