import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CreditNoteData } from '@/schemas/credit-notes';
import { type CreateCreditNotePayload, createCreditNote } from '@/services/credit-notes.service';

export const CREDIT_NOTES_KEY = ['commerce', 'credit-notes'] as const;

// Creates a new credit note and invalidates the list
export function useCreateCreditNote(
  options?: Omit<UseMutationOptions<CreditNoteData, AxiosError, CreateCreditNotePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<CreditNoteData, AxiosError, CreateCreditNotePayload>({
    ...options,
    mutationFn: createCreditNote,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CREDIT_NOTES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
