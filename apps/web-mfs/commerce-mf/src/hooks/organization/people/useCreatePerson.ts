import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PersonData } from '@/schemas/people';
import { type CreatePersonPayload, createPerson } from '@/services/organization/people.service';
import { PEOPLE_TABLE_KEY } from './keys';

export function useCreatePerson(
  options?: Omit<UseMutationOptions<PersonData, AxiosError, CreatePersonPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<PersonData, AxiosError, CreatePersonPayload>({
    ...options,
    mutationFn: createPerson,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PEOPLE_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
