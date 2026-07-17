import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PersonData } from '@/schemas/people';
import { getPerson } from '@/services/organization/people.service';
import { PERSON_KEY } from './keys';

// Fetches ORG person detail by ID; suspends until data is available
export function usePersonById(id: string) {
  return useSuspenseQuery<PersonData, AxiosError>({
    queryKey: PERSON_KEY(id),
    queryFn: () => getPerson(id),
  });
}
