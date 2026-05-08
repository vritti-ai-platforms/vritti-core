import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import { type UpdateInvoicePayload, updateInvoice } from '@/services/invoices.service';
import { INVOICE_KEY, INVOICES_TABLE_KEY } from './keys';

// Updates an invoice and invalidates table + detail
export function useUpdateInvoice(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, { id: string; data: UpdateInvoicePayload }>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; data: UpdateInvoicePayload }>({
    ...options,
    mutationFn: updateInvoice,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: INVOICES_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEY(variables.id) });
      options?.onSuccess?.(...args);
    },
  });
}
