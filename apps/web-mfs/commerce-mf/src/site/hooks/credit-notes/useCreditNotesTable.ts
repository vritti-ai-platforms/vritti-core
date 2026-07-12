import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CreditNoteData } from '@/schemas/credit-notes';
import { getCreditNotesTable } from '@/site/services/credit-notes.service';
import { CREDIT_NOTES_TABLE_KEY } from './keys';

// Fetches credit notes list
export function useCreditNotesTable(
  options?: Omit<UseQueryOptions<CreditNoteData[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<CreditNoteData[], AxiosError>({
    queryKey: CREDIT_NOTES_TABLE_KEY,
    queryFn: getCreditNotesTable,
    ...options,
  });
}
