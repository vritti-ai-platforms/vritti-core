import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { type UpdatePersonPayload, updatePerson } from '@/services/organization/people.service';
import { PEOPLE_TABLE_KEY, PERSON_KEY } from './keys';

interface Vars {
  id: string;
  data: UpdatePersonPayload;
}

export function useUpdatePerson(options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updatePerson,
    onSuccess: (...args) => {
      const [, vars] = args;
      queryClient.invalidateQueries({ queryKey: PEOPLE_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: PERSON_KEY(vars.id) });
      options?.onSuccess?.(...args);
    },
  });
}
