import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PersonCounts } from '@/schemas/people';
import { getPersonCounts } from '@/services/organization/people.service';
import { PERSON_COUNTS_KEY } from './keys';

// Fetches how many rows each tab of a person lists; under the person's key, so whatever refreshes the person
// refreshes them
export function usePersonCounts(id: string) {
  return useQuery<PersonCounts, AxiosError>({
    queryKey: PERSON_COUNTS_KEY(id),
    queryFn: () => getPersonCounts(id),
  });
}
