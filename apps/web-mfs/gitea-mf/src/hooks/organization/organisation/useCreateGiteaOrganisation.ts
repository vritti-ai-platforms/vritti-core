import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CreateResponse } from '@/schemas/common';
import type { OrganisationData } from '@/schemas/organisation';
import { createOrganisation } from '@/services/organization/organisation.service';
import { GITEA_ORGANISATION_KEY } from './keys';

type Options = Omit<UseMutationOptions<CreateResponse<OrganisationData>, AxiosError, void>, 'mutationFn'>;

export function useCreateGiteaOrganisation(options?: Options) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<OrganisationData>, AxiosError, void>({
    mutationFn: createOrganisation,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GITEA_ORGANISATION_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
