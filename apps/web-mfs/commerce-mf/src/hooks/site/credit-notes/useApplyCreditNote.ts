import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { INVOICES_TABLE_KEY } from '@/hooks/site/invoices';
import { type ApplyCreditNotePayload, applyCreditNote } from '@/services/site/credit-notes.service';
import { CREDIT_NOTE_KEY, CREDIT_NOTES_KEY } from './keys';

// Applies a credit note to an invoice and invalidates related queries
export function useApplyCreditNote(
  creditNoteId: string,
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { id: string; data: ApplyCreditNotePayload }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; data: ApplyCreditNotePayload }>({
    ...options,
    mutationFn: applyCreditNote,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CREDIT_NOTES_KEY });
      queryClient.invalidateQueries({ queryKey: CREDIT_NOTE_KEY(creditNoteId) });
      queryClient.invalidateQueries({ queryKey: INVOICES_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
