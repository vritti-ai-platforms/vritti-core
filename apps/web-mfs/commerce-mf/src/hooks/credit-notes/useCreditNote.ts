import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CreditNoteDetail } from '@/schemas/credit-notes';
import { getCreditNote } from '@/services/credit-notes.service';
import { CREDIT_NOTE_KEY } from './keys';

// Fetches credit note detail with applications
export function useCreditNote(
  id: string | null,
  options?: Omit<UseQueryOptions<CreditNoteDetail, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<CreditNoteDetail, AxiosError>({
    queryKey: CREDIT_NOTE_KEY(id ?? ''),
    queryFn: () => getCreditNote(id as string),
    enabled: !!id,
    ...options,
  });
}
