import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import { type ApplyCreditNotePayload, applyCreditNote } from '@/services/credit-notes.service';
import { CREDIT_NOTES_KEY } from './useCreateCreditNote';
import { INVOICES_TABLE_KEY } from './useInvoicesTable';

// Applies a credit note to an invoice and invalidates related queries
export function useApplyCreditNote(
  creditNoteId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, { id: string; data: ApplyCreditNotePayload }>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; data: ApplyCreditNotePayload }>({
    ...options,
    mutationFn: applyCreditNote,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CREDIT_NOTES_KEY });
      queryClient.invalidateQueries({ queryKey: ['commerce', 'credit-notes', creditNoteId] });
      queryClient.invalidateQueries({ queryKey: INVOICES_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
