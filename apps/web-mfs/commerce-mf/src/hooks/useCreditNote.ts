import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CreditNoteDetail } from '@/schemas/credit-notes';
import { getCreditNote } from '@/services/credit-notes.service';

// Fetches credit note detail with applications
export function useCreditNote(
  id: string | null,
  options?: Omit<UseQueryOptions<CreditNoteDetail, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<CreditNoteDetail, AxiosError>({
    queryKey: ['commerce', 'credit-notes', id],
    queryFn: () => getCreditNote(id as string),
    enabled: !!id,
    ...options,
  });
}
