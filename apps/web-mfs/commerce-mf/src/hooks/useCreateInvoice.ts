import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InvoiceData } from '@/schemas/invoices';
import { type CreateInvoicePayload, createInvoice } from '@/services/invoices.service';
import { INVOICES_TABLE_KEY } from './useInvoicesTable';

// Creates a new invoice and invalidates the table
export function useCreateInvoice(
  options?: Omit<UseMutationOptions<InvoiceData, AxiosError, CreateInvoicePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<InvoiceData, AxiosError, CreateInvoicePayload>({
    ...options,
    mutationFn: createInvoice,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INVOICES_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
