import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CreateSupplierInvoicePayload, SupplierInvoice } from '@/schemas/supplier-invoices';
import { createSupplierInvoice } from '@/services/legal-entity/supplier-invoices.service';
import { LE_SUPPLIER_INVOICES_KEY } from './keys';

// Records a draft invoice from a supplier at one of the legal entity's sites and refreshes its invoices
export function useCreateSupplierInvoice(
  options?: Omit<UseMutationOptions<SupplierInvoice, AxiosError, CreateSupplierInvoicePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SupplierInvoice, AxiosError, CreateSupplierInvoicePayload>({
    ...options,
    mutationFn: createSupplierInvoice,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: LE_SUPPLIER_INVOICES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
