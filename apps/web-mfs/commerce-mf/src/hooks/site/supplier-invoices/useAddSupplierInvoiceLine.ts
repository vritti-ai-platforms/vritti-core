import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { PURCHASE_ORDERS_KEY } from '@/hooks/site/purchase-orders/keys';
import type { AddSupplierInvoiceLineVars } from '@/schemas/supplier-invoices';
import { addSupplierInvoiceLine } from '@/services/site/supplier-invoices.service';
import { SITE_SUPPLIER_INVOICES_KEY } from './keys';

// Adds an item line to an invoice through its supplier and refreshes the site's invoices and purchase orders
export function useAddSupplierInvoiceLine(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, AddSupplierInvoiceLineVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, AddSupplierInvoiceLineVars>({
    ...options,
    mutationFn: addSupplierInvoiceLine,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIER_INVOICES_KEY });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
